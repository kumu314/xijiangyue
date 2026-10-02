# -*- coding: utf-8 -*-
"""红线严格校验：合并前后逐篇【文本字节】比对（不只是 JSON 语义哈希）。
   语义哈希相等 ≠ 文本零变化——缩进/键序/转义都可能变。
   做法：跑 write 落盘后，重新扫新旧两个文件的 POEMS 对象文本，逐篇 byte 比对。
"""
import json, os, re, sys, hashlib
REPO = r"D:/ZCode/小程序/xijiangyue"
os.chdir(REPO)

def load(path):
    return open(path, "rb").read().decode("utf-8")

def span(t, marker="const POEMS"):
    m = re.search(re.escape(marker) + r"\s*=\s*\[", t)
    assert m, marker
    st = m.end() - 1
    i, d, ins, esc = st, 0, False, False
    while i < len(t):
        ch = t[i]
        if ins:
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == '"': ins = False
        else:
            if ch == '"': ins = True
            elif ch == "[": d += 1
            elif ch == "]":
                d -= 1
                if d == 0: return st, i
        i += 1
    raise AssertionError("no end")

def split_top(s):
    objs = []; i, n = 1, len(s)
    while i < n:
        while i < n and s[i] not in "{}]": i += 1
        if i >= n or s[i] == "]": break
        b = i; d, ins, esc = 0, False, False
        while i < n:
            ch = s[i]
            if ins:
                if esc: esc = False
                elif ch == "\\": esc = True
                elif ch == '"': ins = False
            else:
                if ch == '"': ins = True
                elif ch == "{": d += 1
                elif ch == "}":
                    d -= 1
                    if d == 0: break
            i += 1
        objs.append((s[b:i+1], b)); i += 1
    return objs

old_path, new_path = sys.argv[1], sys.argv[2]
ot_ = load(old_path); nt_ = load(new_path)
os_, oe_ = span(ot_); ns_, ne_ = span(nt_)
oarr = ot_[os_:oe_+1]; narr = nt_[ns_:ne_+1]
oo = split_top(oarr); no = split_top(narr)
print("objs old/new: %d / %d" % (len(oo), len(no)))

def pid(ot):
    m = re.search(r'"id"\s*:\s*"((?:[^"\\]|\\.)*)"', ot)
    return json.loads('"' + m.group(1) + '"') if m else None

oids = [pid(x[0]) for x in oo]
nids = [pid(x[0]) for x in no]
print("id order identical:", oids == nids)

# 对象文本（去掉前导逗号/空白后的规范体）
changed_txt = []
for k, ((oa, _), (na, _)) in enumerate(zip(oo, no)):
    if oa.strip() != na.strip():
        # 是否只是空白差异？
        if re.sub(r"\s+", "", oa) == re.sub(r"\s+", "", na):
            print("  [whitespace-only] %s" % oids[k])
        changed_txt.append(oids[k])

print("text-changed objects: %d" % len(changed_txt))
print("byte-identical objects: %d" % (len(oo) - len(changed_txt)))

# 全文其他区域（POEMS 之外的 HTML/CSS/JS）是否零变化
head_old = ot_[:os_]; head_new = nt_[:ns_]
tail_old = ot_[oe_+1:]; tail_new = nt_[ne_+1:]
print("head bytes identical:", head_old == head_new, "(%d)" % len(head_old))
print("tail bytes identical:", tail_old == tail_new, "(%d)" % len(tail_old))

# 行尾核对：比对「新旧行尾形态是否一致」，而非写死要求 CRLF。
# 本仓库 .gitattributes 为 `*.html text eol=lf`，正解是 LF；写死 CRLF 会误报。
def eolkind(t):
    crlf = t.count("\r\n")
    lfonly = t.count("\n") - crlf
    if crlf == 0 and lfonly > 0:
        return "LF", crlf, lfonly
    if lfonly == 0 and crlf > 0:
        return "CRLF", crlf, lfonly
    return "MIXED", crlf, lfonly

ko, co, lo = eolkind(ot_)
kn, cn, ln = eolkind(nt_)
print("EOL old: %s (crlf=%d lfonly=%d)" % (ko, co, lo))
print("EOL new: %s (crlf=%d lfonly=%d)" % (kn, cn, ln))
print("EOL preserved:", ko == kn and ko != "MIXED")
