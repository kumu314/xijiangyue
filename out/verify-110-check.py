# -*- coding: utf-8 -*-
"""灵玉 2026-10-12 独立复核：workbuddy #110 未提交改动（feihuaData 20 处科白括号补全）
只读 + 断言，不写 index.html。
"""
import io, json, re, subprocess, sys, hashlib

REPO = r"D:/ZCode/小程序/xijiangyue"
P = REPO + "/index.html"

def head_bytes():
    return subprocess.run(["git", "-C", REPO, "show", "HEAD:index.html"],
                          stdout=subprocess.PIPE, check=True).stdout

hb = head_bytes()
wb = open(P, "rb").read()

print("== 0. 文件级 ==")
print("HEAD bytes   :", len(hb))
print("work  bytes  :", len(wb))
print("HEAD sha256  :", hashlib.sha256(hb).hexdigest()[:16])
print("work  sha256 :", hashlib.sha256(wb).hexdigest()[:16])
print("CRLF(work)   :", wb.count(b"\r\n"))

hl = hb.decode("utf-8").split("\n")
wl = wb.decode("utf-8").split("\n")
print("HEAD lines   :", len(hl))
print("work  lines  :", len(wl))
assert len(hl) == len(wl), "行数不一致，改动超出单行！"

diff_idx = [i for i in range(len(hl)) if hl[i] != wl[i]]
print("== 1. 差异行号(1-based) ==", [i + 1 for i in diff_idx])
assert len(diff_idx) == 1, "差异行数 != 1，改动面超出预期！"

i = diff_idx[0]
oh, nw = hl[i], wl[i]
print("差异行长度: HEAD", len(oh), "-> work", len(nw), "Δ", len(nw) - len(oh))

# 逐字符差异（1.2M 字符，禁用 difflib；改用「去括号后应逐字相同」+ 括号计数）
print("== 2. 括号剥离后等价性 ==")
import re as _re
strip_re = _re.compile(r"[〔〕()（）]")
print("去掉全部括号后两行逐字相同:", strip_re.sub("", oh) == strip_re.sub("", nw))
print("非括号字符数 HEAD/work:", len(strip_re.sub("", oh)), len(strip_re.sub("", nw)))
# 括号出现序列差异
def seq(s):
    return "".join(c for c in s if c in "〔〕()（）")
sh_seq, sw_seq = seq(oh), seq(nw)
print("括号序列长度 HEAD/work:", len(sh_seq), len(sw_seq))
print("括号计数 HEAD:", {c: oh.count(c) for c in "〔〕()"})
print("括号计数 work:", {c: nw.count(c) for c in "〔〕()"})

# 括号总量（整行 = feihuaData 那一行）
print("== 3. feihuaData 括号内总量（差异行整行） ==")
for nm, s in (("HEAD", oh), ("work", nw)):
    print(f"{nm}: 〔={s.count('〔')} 〕={s.count('〕')} (={s.count('(')} )={s.count(')')} 半角合计={s.count('(')+s.count(')')}")

# 解析 JSON 校验
print("== 4. JSON 解析与结构 ==")
def parse(line):
    return json.loads(line)
jh, jw = parse(oh), parse(nw)
for nm, j in (("HEAD", jh), ("work", jw)):
    tot = sum(len(v) for v in j["lines"].values())
    print(f"{nm}: keys={len(j['keys'])} 片段总数={tot}")

# 不配对统计
def unmatched(j):
    res = []
    for k, arr in j["lines"].items():
        for s in arr:
            if s.count("〔") != s.count("〕") or s.count("(") != s.count(")"):
                res.append((k, s))
    return res
uh, uw = unmatched(jh), unmatched(jw)
print("HEAD 不配对条目:", len(uh), " 去重:", len(set(s for _, s in uh)))
print("work 不配对条目:", len(uw), " 去重:", len(set(s for _, s in uw)))
if uw:
    print("  work 残余样本:", uw[:10])

# 改动项清单（HEAD -> work 的条目级映射）
sh, sw = set(), set()
for k, arr in jh["lines"].items():
    for s in arr:
        sh.add((k, s))
for k, arr in jw["lines"].items():
    for s in arr:
        sw.add((k, s))
gone, come = sorted(sh - sw), sorted(sw - sh)
print("== 5. 条目级差异 ==", "减少", len(gone), "新增", len(come))
for k, s in gone:
    print("  -", k, "|", s)
for k, s in come:
    print("  +", k, "|", s)

# POEMS 区逐字节相同校验（用 lines[].o 之外的粗校验：POEMS 段整体）
mh = re.search(rb"const POEMS\s*=", hb)
mw = re.search(rb"const POEMS\s*=", wb)
print("== 6. POEMS 起点偏移 ==", mh.start(), mw.start(), "相等:", mh.start() == mw.start())

print("== 7. STRIP / submitAnswer 现状 ==")
txt = wb.decode("utf-8")
for pat in (r"const STRIP", r"const FHN", r"function submitAnswer"):
    m = re.search(pat, txt)
    if m:
        ln = txt[:m.start()].count("\n") + 1
        line = txt.split("\n")[ln - 1]
        print(f"  L{ln}: {line[:160]}")
