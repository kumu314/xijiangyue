# -*- coding: utf-8 -*-
"""量化「拓展篇译文被渲染层挡住」的存量 bug 影响面。"""
import json, re
def arr_of(path):
    t = open(path, encoding='utf-8').read()
    m = re.search(r'const POEMS\s*=\s*\[', t)
    st = m.end()-1
    i, d, ins, esc = st, 0, False, False
    while i < len(t):
        ch = t[i]
        if ins:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == '"': ins = False
        else:
            if ch == '"': ins = True
            elif ch == '[': d += 1
            elif ch == ']':
                d -= 1
                if d == 0: return json.loads(t[st:i+1])
        i += 1

isOrig = re.compile(r'[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0980-\u09FF\u0E00-\u0E7F\u3040-\u30FF]')

rows = []
for label, path in [('合并前', 'out/merge/index.baseline-before-merge.html'), ('合并后', 'index.html')]:
    P = arr_of(path)
    # 渲染层判据：(expand && !hasOrig) → 走「译文正在补充中」，挡住 m
    blocked = []      # 被挡：拓展篇、非外文、但有 m
    shown = []        # 正常显示：非拓展，或有外文
    for p in P:
        ls = p.get('lines') or []
        has_m = any((l.get('m') or '').strip() for l in ls)
        if not has_m: continue
        hasOrig = any(isOrig.search(l.get('m') or '') for l in ls)
        expand = p.get('level') == '拓展'
        if expand and not hasOrig:
            blocked.append(p['id'])
        else:
            shown.append(p['id'])
    print('%s: 有译文 %d 篇 | 正常渲染 %d | **被挡** %d' % (label, len(blocked)+len(shown), len(shown), len(blocked)))
    rows.append((label, set(blocked)))

b0 = rows[0][1]; b1 = rows[1][1]
print()
print('合并前被挡: %d 篇' % len(b0))
print('合并后被挡: %d 篇' % len(b1))
print('本批新引入被挡: %d 篇' % len(b1 - b0))
print()
print('抽样（本批新增被挡）：', sorted(b1 - b0)[:10])
print('抽样（存量被挡）：', sorted(b0)[:10])
