# -*- coding: utf-8 -*-
"""
#68 西江阅内容大合并脚本
把 pilot-01/batch-02/03/04（串讲+记忆）与 qoder-01/trans-01(/trans-02/trans-03)（lines[].m）
机械映射并入 index.html 的 const POEMS 数组。

用法：
    python merge_content.py dry|write [--trans02] [--trans03] [--report]
    --trans02/--trans03 为并入门槛开关（灵玉放行后才加）。幂等：已并入的篇会被
    识别为「同值」而零变化，因此二遍合并 trans-03 时只有第 7 文件那 20 首会变。

设计要点：
- 红线：970 首 id 与顺序逐位不变；未触及篇内容字节级零变化；只动 POEMS 数据。
- 策略：不改整块 JSON 重序列化，而是逐篇定位对象文本边界，只对需改的篇做
  定点插入/替换 → 未触及的篇逐字节不动 → 天然满足「内容零变化」。
- 格式：新值排布风格与库内逐字符一致（多行展开 / 紧凑自适应，EOL 跟随输入）。
- 幂等：重复跑读数一致。
"""
import json, os, re, sys

REPO = r"D:/ZCode/小程序/xijiangyue"
os.chdir(REPO)

MODE = "write" if "write" in sys.argv else "dry"
INCLUDE_TRANS02 = ("--trans02" in sys.argv)
INCLUDE_TRANS03 = ("--trans03" in sys.argv)
REPORT_ONLY = ("--report" in sys.argv)

SRC = [
    ("out/content_pilot/pilot-01.json",        "v1_pilot"),
    ("out/content_production/batch-02.json",   "v2_batch"),
    ("out/content_production/batch-03.json",   "v2_batch"),
    ("out/content_production/batch-04.json",   "v2_batch"),
    ("out/content_pilot/qoder-01.json",        "trans"),
    ("out/content_production/trans-01.json",   "trans"),
    # ---- merge-02（灵玉 10-05 派单，四批已 PASS）----
    ("out/content_production/batch-05.json",   "v2_batch"),   # scenes_new + memory_new
    ("out/content_production/batch-06.json",   "v2_batch"),   # 串讲 + memory_new
    ("out/content_production/trans-04.json",  "trans"),      # lines[].m
    ("out/content_production/trans-05.json",  "trans"),      # lines[].m
]
if INCLUDE_TRANS02 or INCLUDE_TRANS03:
    SRC.append(("out/content_production/trans-02.json", "trans"))
if INCLUDE_TRANS03:
    SRC.append(("out/content_production/trans-03.json", "trans"))

log = []
def L(s):
    log.append(s)
    print(s)

# ---------- 1. 读 index.html ----------
raw = open("index.html", "rb").read()
text = raw.decode("utf-8")
# 行尾契约：本仓库 .gitattributes 为 `*.html text eol=lf`，入库与检出均为 LF。
# 脚本原本写死 CRLF，会把整个 index.html 改写成 CRLF，制造全文件 diff——已废弃。
# 改为「跟随输入文件的实际行尾」，写回时保持完全一致，绝不引入行尾变更。
CRLF = text.count("\r\n")
LFONLY = text.count("\n") - CRLF
if CRLF == 0:
    EOL = "\n"
elif LFONLY == 0:
    EOL = "\r\n"
else:
    raise AssertionError("mixed line endings: crlf=%d lfonly=%d" % (CRLF, LFONLY))
print("[eol] detected %s (crlf=%d lfonly=%d)" % ("CRLF" if EOL == "\r\n" else "LF", CRLF, LFONLY))
ORIG_RAW = raw

def find_array_span(t, marker="const POEMS"):
    m = re.search(re.escape(marker) + r"\s*=\s*\[", t)
    assert m, marker + " not found"
    st = m.end() - 1
    i, depth, in_str, esc = st, 0, False, False
    while i < len(t):
        ch = t[i]
        if in_str:
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == '"': in_str = False
        else:
            if ch == '"': in_str = True
            elif ch == "[": depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    return st, i
        i += 1
    raise AssertionError("array end not found")

arr_start, arr_end = find_array_span(text)
arr_text = text[arr_start:arr_end + 1]
L("POEMS array span: %d..%d (len %d)" % (arr_start, arr_end, len(arr_text)))

def split_top_objects(s):
    objs = []
    i, n = 1, len(s)
    while i < n:
        while i < n and s[i] not in "{}]":
            i += 1
        if i >= n or s[i] == "]":
            break
        st = i
        depth, in_str, esc = 0, False, False
        while i < n:
            ch = s[i]
            if in_str:
                if esc: esc = False
                elif ch == "\\": esc = True
                elif ch == '"': in_str = False
            else:
                if ch == '"': in_str = True
                elif ch == "{": depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0: break
            i += 1
        objs.append((s[st:i + 1], st))
        i += 1
    return objs

objs = split_top_objects(arr_text)
assert len(objs) == 970, "expected 970 objects, got %d" % len(objs)

def extract_id(ot):
    mm = re.search(r'"id"\s*:\s*"((?:[^"\\]|\\.)*)"', ot)
    return json.loads('"' + mm.group(1) + '"') if mm else None

id_list = [extract_id(ot) for ot, _ in objs]
assert len(set(id_list)) == 970, "duplicate ids!"
id_pos = {pid: k for k, pid in enumerate(id_list)}
L("poems: 970, unique ids: 970")

# ---------- 2. 载入源文件 ----------
sources = []
for path, kind in SRC:
    if not os.path.exists(path):
        L("!! MISSING %s — skip" % path); continue
    d = json.load(open(path, encoding="utf-8"))
    sources.append((path, d["batch"], kind, d["poems"]))
    L("loaded %-42s batch=%-10s poems=%d" % (path, d["batch"], len(d["poems"])))

# ---------- 3. 计算每篇要做的改动 ----------
# patches: id -> {"串讲": str?, "memory": <replacement json text>?, "lines": {o_index: m}?}
patches = {}
skipped = []          # (id, reason, detail)
op_count = {"串讲": 0, "memory": 0, "m": 0}
seen_ids = {}

for path, batch, kind, poems in sources:
    for p in poems:
        pid = p["id"]
        if pid not in id_pos:
            skipped.append((pid, "not-in-POEMS", batch)); continue
        if pid in seen_ids:
            L("!! DUPLICATE across batches: %s (%s vs %s)" % (pid, seen_ids[pid], batch))
        seen_ids[pid] = batch
        pk = patches.setdefault(pid, {})
        if kind in ("v1_pilot", "v2_batch"):
            if "串讲" in p:
                pk["串讲"] = p["串讲"]; op_count["串讲"] += 1
            if kind == "v1_pilot":
                if "记忆技巧" in p:
                    # 保留 Python 对象，序列化交给 set_kv/append_kv（按库内风格出格式）
                    pk["memory"] = [{"t": "记忆技巧", "d": p["记忆技巧"]}]
                    op_count["memory"] += 1
            else:
                if "memory_new" in p:
                    pk["memory"] = p["memory_new"]
                    op_count["memory"] += 1
            # merge-02：scenes_new -> scenes（整体替换；条数与 t 标签须与库内逐一对应）
            if "scenes_new" in p:
                pk["scenes"] = p["scenes_new"]
                op_count["scenes"] = op_count.get("scenes", 0) + 1
        else:  # trans
            pk["lines"] = p["lines"]

L("")
L("planned ops: 串讲=%d  memory=%d  scenes=%d  trans-poems=%d" % (op_count["串讲"], op_count["memory"],
       op_count.get("scenes", 0),
       op_count.get("m", 0) or sum(1 for v in patches.values() if "lines" in v)))
L("distinct target poems: %d" % len(patches))
L("skipped (not-in-POEMS): %d" % len(skipped))
for s in skipped[:20]:
    L("   skip %s (%s) %s" % (s[0], s[1], s[2]))

# ---------- 4. 对每篇生成改后的对象文本 ----------
def fmt_val(val, base_ind, style):
    """按库内风格序列化 val。
    style='multi'  -> 多行展开（数组/对象的每个元素独立成行）
    style='compact'-> 紧凑单行（json.dumps 默认）
    缩进基准 base_ind 用 EOL 拼行，与库内一致。
    多行风格样例（库内权威，见 jingyesi 的 lines / 大司命的 memory）：
        [
           {
            "o": "...",
            "m": "..."
           }
          ]
    即：数组元素前 base+1 空格、元素内字段前 base+2 空格、闭合括号前 base 空格。
    """
    if style == "compact":
        return json.dumps(val, ensure_ascii=False)

    def enc(v, depth):
        """depth = 该值所在行的缩进空格数（相对 base_ind）"""
        pad = base_ind + " " * depth
        if isinstance(v, list):
            if not v:
                return "[]"
            parts = [enc(x, depth + 1) for x in v]
            return ("[" + EOL
                    + ("," + EOL).join(pad + " " + p for p in parts)
                    + EOL + pad + "]")
        if isinstance(v, dict):
            if not v:
                return "{}"
            parts = []
            for k, x in v.items():
                kk = json.dumps(k, ensure_ascii=False)
                xv = enc(x, depth + 1)
                parts.append(kk + ": " + xv)
            return ("{" + EOL
                    + ("," + EOL).join(pad + " " + p for p in parts)
                    + EOL + pad + "}")
        return json.dumps(v, ensure_ascii=False)

    return enc(val, 0)


def detect_style(ot, vstart, vend):
    """探测被替换值原本的排布风格"""
    seg = ot[vstart:vend]
    return "multi" if EOL in seg else "compact"


def set_kv(ot, key, val, val_json=None):
    """在对象中替换/插入 "key": val。保留原缩进与行尾。
    val 传 Python 对象（用于按原风格重新序列化）；val_json 传字符串则直接用（兼容旧调用）。"""
    pat = re.compile(r'("' + re.escape(key) + r'"\s*:\s*)', re.S)
    mm = pat.search(ot)
    if mm:
        vstart = mm.end()
        # 值结束位置：从 vstart 扫描到遇到 逗号(顶层) 或 对象结束
        i, depth, in_str, esc = vstart, 0, False, False
        vend = -1
        while i < len(ot):
            ch = ot[i]
            if in_str:
                if esc: esc = False
                elif ch == "\\": esc = True
                elif ch == '"': in_str = False
            else:
                if ch == '"': in_str = True
                elif ch in "[{": depth += 1
                elif ch in "]}":
                    if depth == 0: vend = i; break
                    depth -= 1
                elif ch == "," and depth == 0:
                    vend = i; break
            i += 1
        if vend < 0: vend = len(ot)

        if val_json is not None:
            newv = val_json
        else:
            # 探测该值所在的层级缩进（该 key 行首到 key 的空白）
            lstart = ot.rfind(EOL, 0, mm.start())
            keyline = ot[lstart + len(EOL):mm.start()] if lstart >= 0 else ""
            base_ind = keyline[:len(keyline) - len(keyline.lstrip())]
            style = detect_style(ot, vstart, vend)
            newv = fmt_val(val, base_ind, style)
        return ot[:vstart] + newv + ot[vend:], True
    # 追加：找对象最后一个 '}' 之前
    return ot, False

def append_kv(ot, key, val, val_json=None):
    """追加键值：插在最后一个 } 前，沿用对象的换行缩进风格。"""
    last = ot.rfind("}")
    body = ot[:last]
    # 探测缩进：行首空白
    m_ind = re.search(r'\r?\n(\s*)"', ot)
    ind = m_ind.group(1) if m_ind else "  "
    # 该对象是单行还是多行？
    if EOL not in ot:
        # 单行紧凑格式：{ "a": 1, "b": 2 }  → 追加 , "key": val
        assert body.rstrip().endswith(",") or body.rstrip().endswith("{"), \
            "unexpected compact obj: " + ot[:80]
        sep = " " if body.rstrip().endswith(",") else ", "
        vj = val_json if val_json is not None else json.dumps(val, ensure_ascii=False)
        return body + sep + '"%s": %s' % (key, vj) + " }", True
    # 多行格式
    body = body.rstrip()
    assert body.endswith(","), "unexpected multi obj tail: " + repr(body[-40:])
    nl = EOL
    # 多行风格：值也按多行展开（缩进基准 = key 所在行的缩进）
    if val_json is not None and not isinstance(val, (list, dict)):
        vtxt = val_json
    else:
        vtxt = fmt_val(val, ind, "multi")
    return body + nl + ind + '"%s": %s' % (key, vtxt) + nl + ot[last], True

stats = {"changed": 0, "m_written": 0, "m_skip": 0, "o_mismatch": 0,
         "scenes_written": 0, "scenes_skip": 0}
m_mismatch = []
drift_align = []          # 漂移自动对齐记录：(id, 剥离字, 库内 o)
new_list = list(objs)

for pid, pk in patches.items():
    k = id_pos[pid]
    ot, st = objs[k]
    orig = ot
    # (a) 串讲
    if "串讲" in pk:
        vj = json.dumps(pk["串讲"], ensure_ascii=False)
        nv, done = set_kv(ot, "串讲", pk["串讲"])
        if not done:
            nv, done = append_kv(ot, "串讲", vj)
        ot = nv
    # (b) memory
    if "memory" in pk:
        nv, done = set_kv(ot, "memory", pk["memory"])
        if not done:
            nv, done = append_kv(ot, "memory", pk["memory"])
        ot = nv
    # (b2) scenes_new -> scenes（merge-02）：整体替换，条数与键结构以库内为准
    if "scenes" in pk:
        try:
            lib_scenes = (json.loads(orig).get("scenes") or [])
            ok_parse = True
        except Exception as e:
            ok_parse = False
            stats["scenes_skip"] += 1
            skipped.append((pid, "scenes-obj-parse-fail", str(e)))
        if ok_parse:
            sn = pk["scenes"]
            if len(lib_scenes) != len(sn):
                stats["scenes_skip"] += 1
                skipped.append((pid, "scenes-len-mismatch",
                                "cur=%d src=%d" % (len(lib_scenes), len(sn))))
            else:
                new_scenes = []
                for lsc, snc in zip(lib_scenes, sn):
                    merged = {}
                    for kk in lsc.keys():
                        merged[kk] = snc.get(kk, lsc.get(kk))  # 缺键补齐（以库内为准）
                    new_scenes.append(merged)
                nv, done = set_kv(ot, "scenes", new_scenes)
                if not done:
                    nv, done = append_kv(ot, "scenes", new_scenes)
                ot = nv
                stats["scenes_written"] += 1
    # (c) lines[].m —— 需要 o 快照漂移闸
    if "lines" in pk:
        try:
            cur = json.loads(ot)
        except Exception as e:
            skipped.append((pid, "obj-parse-fail", str(e))); continue
        cur_lines = cur.get("lines") or []
        src_lines = pk["lines"]
        if len(cur_lines) != len(src_lines):
            skipped.append((pid, "lines-len-mismatch",
                            "cur=%d src=%d" % (len(cur_lines), len(src_lines))))
            m_mismatch.append((pid, "len", len(cur_lines), len(src_lines)))
        else:
            # 快照漂移闸 + 窄化自动对齐
            # 已知形态：源 o 带曲牌标记前导字（如「幺」），库内已剥离
            # 仅当「源 o 去掉前导 1 字 == 库内 o（逐字全等）」才允许对齐，并记入报告
            new_lines = []
            ok = True
            for cl, sl in zip(cur_lines, src_lines):
                co = cl.get("o"); so = sl.get("o")
                if co == so:
                    pass
                elif so and len(so) > 1 and so[1:] == co and so[0] in "幺么":
                    drift_align.append((pid, so[0], co))
                else:
                    ok = False
                    m_mismatch.append((pid, "o", co, so))
                    break
                nl = dict(cl)
                nl["m"] = sl["m"]
                new_lines.append(nl)
            if ok:
                # 重建 lines 数组文本：只替换原 lines 段
                lmm = re.search(r'"lines"\s*:\s*\[', ot)
                if not lmm:
                    skipped.append((pid, "no-lines-field", "")); continue
                ls = lmm.end() - 1
                i, depth, in_str, esc = ls, 0, False, False
                while i < len(ot):
                    ch = ot[i]
                    if in_str:
                        if esc: esc = False
                        elif ch == "\\": esc = True
                        elif ch == '"': in_str = False
                    else:
                        if ch == '"': in_str = True
                        elif ch == "[": depth += 1
                        elif ch == "]":
                            depth -= 1
                            if depth == 0: break
                    i += 1
                le = i + 1
                # lines 重建：与库内格式逐字符一致（库内权威样本见 jingyesi）。
                #   [\n
                #      {\n
                #       "o": "...",\n
                #       "m": "..."\n
                #      },\n
                #      {...}\n
                #     ]
                # 缩进：元素 3 空格 / 字段 4 空格 / 结尾 ] 前 2 空格
                elems = []
                for x in new_lines:
                    elems.append(
                        "   {" + EOL
                        + '    "o": %s,' % json.dumps(x["o"], ensure_ascii=False) + EOL
                        + '    "m": %s' % json.dumps(x["m"], ensure_ascii=False) + EOL
                        + "   }")
                inner = EOL + ("," + EOL).join(elems) + EOL + "  "
                ot = ot[:ls] + "[" + inner + "]" + ot[le:]
                stats["m_written"] += 1
            else:
                stats["m_skip"] += 1
                skipped.append((pid, "o-mismatch", ""))

    if ot != orig:
        stats["changed"] += 1
        new_list[k] = (ot, st)

# ---------- 5. 拼回全文 ----------
parts = []
prev_end = 0
for ot, st in new_list:
    parts.append(arr_text[prev_end:st])
    parts.append(ot)
    prev_end = st + len(objs[id_pos[id_list[0]]][0]) if False else prev_end  # noop
# 正确做法：按原 st 顺序拼
parts = []
cursor = 0
for k, (ot, st) in enumerate(new_list):
    if st <= cursor:
        continue
    parts.append(arr_text[cursor:st])
    parts.append(ot)
    cursor = st + len(objs[k][0])
parts.append(arr_text[cursor:])
new_arr = "".join(parts)

new_text = text[:arr_start] + new_arr + text[arr_end + 1:]
new_raw = new_text.encode("utf-8")

L("")
L("=== RESULT ===")
L("changed objects: %d" % stats["changed"])
L("m written: %d ; m skipped: %d" % (stats["m_written"], stats["m_skip"]))
L("scenes written: %d ; scenes skipped: %d" % (stats["scenes_written"], stats["scenes_skip"]))
L("size: %d -> %d (delta %+d)" % (len(ORIG_RAW), len(new_raw), len(new_raw) - len(ORIG_RAW)))

# 校验：新 POEMS 能被 JSON 解析 & id 序不变
try:
    arr2 = new_text[arr_start:arr_end + len(new_raw) - len(ORIG_RAW) + 1]
    # 直接再定位一次
    a2s, a2e = find_array_span(new_text)
    parsed = json.loads(new_text[a2s:a2e + 1])
    L("re-parse OK, n=%d" % len(parsed))
    new_ids = [p["id"] for p in parsed]
    L("id order identical: %s" % (new_ids == id_list))
except Exception as e:
    L("!! RE-PARSE FAIL: %r" % (e,))
    parsed = None

if parsed:
    # 逐篇内容哈希（用于红线2：未触及篇零变化）
    import hashlib, copy
    def h(o):
        return hashlib.sha256(json.dumps(o, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:16]
    orig_parsed = json.loads(arr_text)
    touched = set(patches.keys())
    changed_ids, unchanged_ok = [], 0
    for a, b in zip(orig_parsed, parsed):
        if a["id"] != b["id"]:
            L("!! ID MISMATCH at %s" % a["id"]); break
        if h(a) != h(b):
            changed_ids.append(a["id"])
        else:
            unchanged_ok += 1
    L("touched set size: %d" % len(touched))
    L("actually changed: %d" % len(changed_ids))
    L("unchanged (hash-equal): %d" % unchanged_ok)
    extra = set(changed_ids) - touched
    if extra:
        L("!! CHANGED BUT NOT IN TOUCHED: %s" % sorted(extra)[:20])
    L("all changed ⊆ touched: %s" % (not extra))
    # 逐篇抽样验证并入内容
    vmap = {p["id"]: p for p in parsed}
    for sample in list(patches.keys())[:3]:
        p = vmap[sample]
        mm = p.get("memory") or []
        mts = [x.get("t") if isinstance(x, dict) else type(x).__name__
               for x in mm][:3] if isinstance(mm, list) else [type(mm).__name__]
        L("sample %s: keys=%s memory_t=%s" % (
            sample, [k for k in p if k in ("串讲", "memory", "lines")], mts))
    # 结构完整性：全篇 memory 必须是 list[dict]
    badmem = [p["id"] for p in parsed
              if not (isinstance(p.get("memory"), list)
                      and all(isinstance(x, dict) for x in p["memory"]))]
    L("memory shape violations: %d %s" % (len(badmem), badmem[:10]))

if MODE == "write":
    # 备份：仅在基线不存在时落盘一次（幂等重跑不得覆盖基线，
    # 否则二跑的「基线」会变成中间产物，红线2 的比对失去意义）。
    bk = "out/merge/index.baseline-before-merge.html"
    if not os.path.exists(bk):
        open(bk, "wb").write(ORIG_RAW)
        L("baseline written -> %s (%d bytes)" % (bk, len(ORIG_RAW)))
    else:
        L("baseline exists, kept -> %s" % bk)
    open("index.html", "wb").write(new_raw)
    L("WROTE index.html")
else:
    L("(dry run — 未写盘。用 write 参数落盘)")

# 报告
os.makedirs("out/merge", exist_ok=True)
with open("out/merge/_merge_log.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(log))
with open("out/merge/_merge_skipped.json", "w", encoding="utf-8") as f:
    json.dump({"skipped": skipped, "m_mismatch": m_mismatch,
               "drift_align": [{"id": a[0], "stripped": a[1], "lib_o": a[2]}
                               for a in drift_align]},
              f, ensure_ascii=False, indent=1)
L("drift auto-aligned: %d" % len(drift_align))
for a in drift_align:
    L("   align %s: 剥离前导「%s」-> %r" % (a[0], a[1], a[2]))
L("log -> out/merge/_merge_log.txt ; skipped -> out/merge/_merge_skipped.json")
