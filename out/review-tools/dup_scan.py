# -*- coding: utf-8 -*-
"""全库近重复扫描（选题池去重闸门 · 固定口径 v1）

用途：**起新批之前**跑一遍，把「与库内已有篇目近重复」的选题挡下来，
避免重复收录继续累积（2026-10-10 实测：既有 35 组 / 70 篇 = 7.22% 重复收录，
根因是选题池「全库 − 已发批」未排除库内已有同篇）。

口径（写死，换口径不可直接比较）：
  · 抹去非汉字（保留 CJK 基本区 + 扩展 A/B 等）
  · 4-gram 倒排 → 统计每对篇目共享 4-gram 数 h 与比值 h/(较短篇长-G+1)
  · 候选阈值：h >= MIN_HITS 且 ratio >= MIN_RATIO
  · **结果是下界**：短篇 + 多异文时分辨力下降（长干曲其一 0.471 / 出塞↔盖罗缝 0.360），
    故须同时看绝对命中数，不能只看比值。

退出码：
  0 = 未发现候选（可起批）
  1 = 发现候选（须人工核正文，逐对判定真假）
  2 = 运行错误

用法：
  python dup_scan.py                       # 扫全库，默认阈值
  python dup_scan.py --min-hits 6 --min-ratio 0.25
  python dup_scan.py --json out/dup_scan.json
  python dup_scan.py --exclude "xf_*,guanjv"   # 排除已知组（逗号分隔 id / 前缀*）
"""
import argparse, json, io, re, sys
from collections import defaultdict

DEF_HTML = "D:/ZCode/小程序/xijiangyue/index.html"
CJK = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\U00020000-\U0002ffff]")
G = 4


def extract_poems(html):
    """自写括号匹配器解析 const POEMS（不能对整文件 json.loads）。"""
    i = html.index("const POEMS = ")
    j = html.index("[", i)
    depth = 0; k = j; in_str = False; esc = False
    while k < len(html):
        c = html[k]
        if in_str:
            if esc: esc = False
            elif c == "\\": esc = True
            elif c == '"': in_str = False
        else:
            if c == '"': in_str = True
            elif c == "[": depth += 1
            elif c == "]":
                depth -= 1
                if depth == 0: break
        k += 1
    return json.loads(html[j:k + 1])


def norm(s):
    return "".join(CJK.findall(s or ""))


def ptext(p):
    return "".join(l.get("o", "") for l in (p.get("lines") or []) if isinstance(l, dict))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", default=DEF_HTML)
    ap.add_argument("--min-hits", type=int, default=6)
    ap.add_argument("--min-ratio", type=float, default=0.25)
    ap.add_argument("--json", default=None, help="把候选写为 JSON")
    ap.add_argument("--exclude", default="", help="排除已知组：逗号分隔 id 或前缀*")
    ap.add_argument("--known", default=None,
                    help="已知基线清单文件（默认同目录 dup_known.txt；不存在则忽略）")
    ap.add_argument("--no-known", action="store_true", help="不加载已知基线清单")
    ap.add_argument("--top", type=int, default=200)
    a = ap.parse_args()

    try:
        raw = io.open(a.html, "r", encoding="utf-8").read()
        arr = extract_poems(raw)
    except Exception as e:
        print("运行错误: %s" % e, file=sys.stderr)
        return 2

    N = len(arr)
    txt = [norm(ptext(p)) for p in arr]
    ids = [p.get("id") for p in arr]
    title = [p.get("title") for p in arr]
    author = [p.get("author") for p in arr]

    excl = set()
    pref = []
    for tok in [t.strip() for t in a.exclude.split(",") if t.strip()]:
        if tok.endswith("*"):
            pref.append(tok[:-1])
        else:
            excl.add(tok)

    # 已知基线清单（默认同目录 dup_known.txt）
    known_path = a.known
    if known_path is None and not a.no_known:
        import os
        cand = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dup_known.txt")
        known_path = cand if os.path.exists(cand) else None
    n_known = 0
    if known_path:
        try:
            for line in io.open(known_path, "r", encoding="utf-8"):
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                excl.add(line)
                n_known += 1
        except Exception as e:
            print("警告：已知清单读取失败 %s: %s" % (known_path, e), file=sys.stderr)

    def excluded(i):
        if ids[i] in excl:
            return True
        return any(str(ids[i]).startswith(p) for p in pref)

    inv = defaultdict(set)
    for idx, t in enumerate(txt):
        if len(t) < G:
            continue
        seen = set(t[x:x + G] for x in range(len(t) - G + 1))
        for g in seen:
            inv[g].add(idx)

    pairhits = defaultdict(int)
    for g, s in inv.items():
        if len(s) < 2 or len(s) > 150:   # 放宽桶上限，降低漏检
            continue
        sl = sorted(s)
        for x in range(len(sl)):
            for y in range(x + 1, len(sl)):
                pairhits[(sl[x], sl[y])] += 1

    cands = []
    for (x, y), h in pairhits.items():
        m = min(len(txt[x]), len(txt[y]))
        if m == 0:
            continue
        sc = h / max(1, m - G + 1)
        if h >= a.min_hits and sc >= a.min_ratio:
            cands.append((sc, x, y, h, m))
    cands.sort(reverse=True)

    print("=== 全库近重复候选（分母 = 全库 %d 篇；阈值 h>=%d 且 ratio>=%.2f）===" %
          (N, a.min_hits, a.min_ratio))
    n_excl = 0
    rows = []
    for sc, x, y, h, m in cands:
        if excluded(x) or excluded(y):
            n_excl += 1
            continue
        rows.append(dict(ratio=round(sc, 4), hits=h, minlen=m,
                         a=dict(id=ids[x], title=title[x], author=author[x]),
                         b=dict(id=ids[y], title=title[y], author=author[y])))
    for r in rows[:a.top]:
        print("  %.3f  A=%-14s《%s》  B=%-14s《%s》  共享4gram=%d minlen=%d" %
              (r["ratio"], r["a"]["id"], (r["a"]["title"] or "")[:16],
               r["b"]["id"], (r["b"]["title"] or "")[:16], r["hits"], r["minlen"]))
    print("  候选总数 = %d（已知基线 %d 条 + 显式排除命中 %d 条）" % (len(rows), n_known, n_excl))
    print("  提醒：**结果是下界**；短篇+多异文须看绝对命中数兜底。")

    if a.json:
        with io.open(a.json, "w", encoding="utf-8", newline="") as f:
            f.write(json.dumps(dict(n=N, min_hits=a.min_hits, min_ratio=a.min_ratio,
                                    candidates=rows), ensure_ascii=False, indent=2))
        print("  已写 %s" % a.json)

    return 1 if rows else 0


if __name__ == "__main__":
    sys.exit(main())
