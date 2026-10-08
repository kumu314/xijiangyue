# -*- coding: utf-8 -*-
"""n=8 反模板观测项 · 「组」粒度裁决配套计数器（自包含，只读）。

依据：out/review-n8-adjudication-20261008.md（灵玉裁决，枯木 2026-10-08 裁定「判实体口径」）

文本面  = 串讲 + memory_new[].d        （不含旧 memory 字段）
归约    = 《》→T  「」→Q  数字→N  抹标点空白
引文类  = 区段再抹掉结构标记 Q/T 后，是任一篇 lines[].o 拼接串（同法归约）的子串

两种口径：
  【gram 口径】「组」= 去重后的不同 8-gram 串（同一串跨几篇/几对都只计 1 组）
                —— v2.4 原文口径、jingdu 裁决基线口径；裁决后降为**过程量**，不再作阈值单位
  【实体口径】「处」= 目标篇坐标下、被对照篇复用的**极大连续区段**（重叠/相邻 8 字窗口先合并）；
                跨篇按区段文字去重（同一句话被多篇复用只计 1 处）
                —— 裁决后**唯一**计量单位

性质：实体口径 ≤ gram 口径（恒成立：每实体含 ≥1 个 8-gram，且不同实体的 gram 集不相交）。
      故改判实体口径只会降低计数、不会升高，不可能制造新的触阈批。

用法：python n8_counter.py            # 跑标准报告（batch-09 + jingdu + 历史基线 + 逐批回溯）
      python n8_counter.py <批名> ...  # 只跑指定批的明细
只读，不改任何仓库文件。
"""
import io, json, re, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CP = os.path.join(ROOT, 'out', 'content_production')
PILOT = os.path.join(ROOT, 'out', 'content_pilot')
INDEX = os.path.join(ROOT, 'index.html')
N = 8

# 已发批次（时间序）；反模板对照集只用**同线**已发批（串讲线 vs 串讲线）
ORDER = ['pilot-01', 'batch-02', 'batch-03', 'batch-04', 'batch-05', 'batch-06', 'batch-07', 'batch-08',
         'jingdu-sample-01', 'jingdu-batch-01', 'foreign-expand-01', 'batch-09']
FILES = {'pilot-01': os.path.join(PILOT, 'pilot-01.json')}
for nm in ORDER[1:]:
    FILES[nm] = os.path.join(CP, nm + '.json')


def _json(path):
    return json.load(io.open(path, encoding='utf-8'))


def _poems(path):
    d = _json(path)
    return d['poems'] if isinstance(d, dict) else d


def parse_index_lib(path=INDEX):
    """从 index.html 直接解析 const POEMS 数组（括号配平扫描，避免正则误截）"""
    h = io.open(path, encoding='utf-8').read()
    i = h.index('const POEMS')
    j = h.index('[', i)
    depth, k, instr, esc = 0, j, False, False
    while k < len(h):
        c = h[k]
        if instr:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                instr = False
        else:
            if c == '"':
                instr = True
            elif c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    break
        k += 1
    return json.loads(h[j:k + 1])


def norm(s):
    s = s.replace('《', 'T').replace('》', 'T').replace('「', 'Q').replace('」', 'Q')
    return re.sub(r'[\s\W_]+', '', re.sub(r'\d', 'N', s), flags=re.UNICODE)


def bare(s):
    """抹掉结构标记 Q/T（引文类判定用：引号只是排版，不算内容差异）"""
    return s.replace('Q', '').replace('T', '')


def text_of(p):
    t = p.get('串讲') or ''
    for m in (p.get('memory_new') or []):
        t += (m.get('d') or '')
    return norm(t)


CACHE = {}


def load_batch(nm):
    if nm not in CACHE:
        CACHE[nm] = [(p['id'], text_of(p)) for p in _poems(FILES[nm])]
    return CACHE[nm]


_GR = {}


def grams_cached(nm, pid, t):
    key = (nm, pid)
    if key not in _GR:
        _GR[key] = grams_of(t)
    return _GR[key]


_LIB = None


def is_quote(s):
    global _LIB
    if _LIB is None:
        _LIB = [(norm(''.join(l.get('o', '') for l in p.get('lines', [])))) for p in parse_index_lib()]
        _LIB = [(x, bare(x)) for x in _LIB if x]
    sb = bare(s)
    return any(s in o or sb in ob for o, ob in _LIB)


def grams_of(t):
    return set(t[i:i + N] for i in range(max(0, len(t) - N + 1)))


def pair_segments_pos(ct, pt, pg):
    """一对（目标篇 c, 对照篇 p）的全部最长公共区段（长度≥8）；重叠窗口已自动合并。
    pg = pt 的 8-gram 集合（缓存，避免重复计算）"""
    segs = []
    i = 0
    lim = len(ct) - N
    while i <= lim:
        if ct[i:i + N] in pg:
            j = i + N
            while j < len(ct) and ct[i:j + 1] in pt:
                j += 1
            a = i
            while a > 0 and ct[a - 1:j] in pt:
                a -= 1
            segs.append((a, j))
            i = j
        else:
            i += 1
    return segs


def entities_of(ct, priors):
    """目标篇 ct 被 priors 复用的极大连续区段文字集合（篇内并区间）。
    priors: [(key, text, grams_set)]"""
    iv = []
    for _, pt, pg in priors:
        iv += pair_segments_pos(ct, pt, pg)
    iv.sort()
    merged = []
    for a, j in iv:
        if merged and a <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], j))
        else:
            merged.append((a, j))
    return set(ct[a:j] for a, j in merged)


def count_batch(nm, prior_nms):
    """返回 (gram 净, 实体 净, 实体明细 dict)"""
    cur = load_batch(nm)
    cur3 = [(pid, t, grams_cached(nm, pid, t)) for pid, t in cur]
    prior3 = []
    for p in prior_nms:
        for pid, t in load_batch(p):
            prior3.append((f'{p}:{pid}', t, grams_cached(p, pid, t)))
    in_g, cross_g, in_e, cross_e = set(), set(), set(), set()
    for cid, ct, gc in cur3:
        others = [(p, t, g) for p, t, g in cur3 if p != cid]
        for _, _, g in others:
            in_g |= (gc & g)
        in_e |= entities_of(ct, others)
        for _, pt, pg in prior3:
            cross_g |= (gc & pg)
        cross_e |= entities_of(ct, prior3)
    allg, alle = in_g | cross_g, in_e | cross_e
    gq = set(x for x in allg if is_quote(x))
    eq = set(x for x in alle if is_quote(x))
    detail = {'本批内': sorted(in_e, key=len, reverse=True),
              '跨批': sorted(cross_e, key=len, reverse=True),
              '引文类': sorted(eq, key=len, reverse=True)}
    return len(allg) - len(gq), len(alle) - len(eq), detail


def report_batch(nm, prior_nms, detail=True):
    g, e, d = count_batch(nm, prior_nms)
    print(f'\n=== {nm}（对照 = {prior_nms}）===')
    print(f'  【gram 口径】净 {g} 组   【实体口径】净 {e} 处')
    if detail:
        for tag in ('跨批', '本批内'):
            for s in d[tag]:
                mark = '引文类' if s in d['引文类'] else '套语  '
                print(f'    [{tag}][{mark}] [{len(s)}字] {s}')
    return g, e


def agg(names, label):
    items = {nm: [(pid, t, grams_cached(nm, pid, t)) for pid, t in load_batch(nm)] for nm in names}
    gb = {}
    for nm, poems in items.items():
        for _, t, g in poems:
            for x in g:
                gb.setdefault(x, set()).add(nm)
    cross_g = set(x for x, bs in gb.items() if len(bs) >= 2)
    ents = set()
    for a in names:
        priors = [(f'{b}:{p}', t, g) for b in names if b != a for p, t, g in items[b]]
        for _, t, _ in items[a]:
            ents |= entities_of(t, priors)
    gq = set(x for x in cross_g if is_quote(x))
    eq = set(x for x in ents if is_quote(x))
    print(f'\n=== {label} ===')
    print(f'  【gram 口径】跨批 {len(cross_g)} 组（引文类 {len(gq)}）→ 净 {len(cross_g)-len(gq)}')
    print(f'  【实体口径】跨批 {len(ents)} 处（引文类 {len(eq)}）→ 净 {len(ents)-len(eq)}')
    return len(cross_g) - len(gq), len(ents) - len(eq)


def main():
    args = sys.argv[1:]
    if args:
        for nm in args:
            k = ORDER.index(nm)
            report_batch(nm, ORDER[:k])
        return
    print('########## 一、batch-09（被裁批）##########')
    report_batch('batch-09', [x for x in ORDER[:11]])
    print('\n########## 二、阈值依据批：jingdu-batch-01 ##########')
    report_batch('jingdu-batch-01', ['pilot-01', 'batch-02', 'batch-03', 'batch-04', 'batch-05',
                                     'batch-06', 'batch-07', 'batch-08', 'jingdu-sample-01', 'foreign-expand-01'])
    print('\n########## 三、逐批回溯（对照 = 该批之前所有已发串讲批）##########')
    print(f'{"批次":<20}{"gram净":>8}{"实体净":>8}')
    for k, nm in enumerate(ORDER):
        g, e, _ = count_batch(nm, ORDER[:k])
        print(f'{nm:<20}{g:>8}{e:>8}')
    print('\n########## 四、历史基线 ##########')
    agg(['batch-02', 'batch-03', 'batch-04', 'batch-06', 'batch-07', 'batch-08'], '串讲线 6 批跨批')
    agg(['pilot-01', 'batch-02', 'batch-03', 'batch-04', 'batch-05', 'batch-06', 'batch-07', 'batch-08',
         'jingdu-sample-01', 'jingdu-batch-01', 'foreign-expand-01'], '已发串讲线 11 批跨批')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
