# -*- coding: utf-8 -*-
"""卡内自我重复检测器（memory 卡专用）—— 判据的可执行实现。

用途：batch-20/21 抽检发现的系统性缺陷「同一张卡里把一句话说了两遍」。
本文件是**唯一权威实现**，生产方自检与复核方复检必须跑同一份，避免口径漂移。

判据（SPEC 增补建议条款）：
  单卡 d 按 。；！？ 切句 → 任两句去标点空白后
    ① 完全相同，或
    ② 两句都 ≥6 字且编辑距离 ≤ max(2, 20% × 较短句长)
  → 判为「卡内自我重复」。

为什么需要这条：SPEC 对 memory 卡只有字数（55–100）与词表约束。
「同一句话换个说法再写一遍」正好能把 d 凑到 55 字下限，13 项机械判据全绿。

用法：
  python dup_in_card.py <batch-20.json> [batch-21.json ...]
  python dup_in_card.py --json <file.json>     # 机器可读输出
退出码：0 = 无命中；1 = 有命中。
"""
import json
import os
import re
import sys

PUNCT = set("，。；：！？、（）《》「」『』“”‘’—…·〈〉,.;:!?()[]{}<>\"' \t\n\r\u3000")


def strip_all(s):
    return ''.join(ch for ch in s if ch not in PUNCT)


def lev(a, b):
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def split_sents(d):
    return [p for p in (x.strip() for x in re.split(r'[。；！？]', d)) if p]


def find_dup(d):
    """返回 [(句1, 句2, 类型, 编辑距离), ...]"""
    ss = split_sents(d)
    hits = []
    for i in range(len(ss)):
        for j in range(i + 1, len(ss)):
            a, b = strip_all(ss[i]), strip_all(ss[j])
            if not a or not b:
                continue
            if a == b:
                hits.append((ss[i], ss[j], '完全相同', 0))
                continue
            if len(a) >= 6 and len(b) >= 6:
                dd = lev(a, b)
                if dd <= max(2, int(0.2 * min(len(a), len(b)))):
                    hits.append((ss[i], ss[j], '近重复', dd))
    return hits


def scan_batch(path):
    data = json.load(open(path, encoding='utf-8'))
    bn = data.get('batch') or os.path.basename(path).replace('.json', '')
    rows, total = [], 0
    for p in data.get('poems') or []:
        for idx, card in enumerate(p.get('memory_new') or []):
            total += 1
            hits = find_dup(card.get('d', ''))
            if hits:
                rows.append({
                    'batch': bn, 'pid': p.get('id'), 'title': p.get('title', ''),
                    'card_idx': idx, 't': card.get('t', ''),
                    'd': card.get('d', ''), 'len': len(strip_all(card.get('d', ''))),
                    'hits': [{'s1': h[0], 's2': h[1], 'kind': h[2], 'dist': h[3]} for h in hits],
                })
    return bn, rows, total


def main(argv):
    as_json = '--json' in argv
    files = [a for a in argv if not a.startswith('--')]
    if not files:
        print(__doc__)
        return 2
    all_rows, grand_hit, grand_tot = [], 0, 0
    for f in files:
        bn, rows, total = scan_batch(f)
        grand_hit += len(rows)
        grand_tot += total
        pct = (len(rows) / total * 100) if total else 0
        if not as_json:
            print(f'{bn}: 命中 {len(rows)}/{total} 张（{pct:.1f}%）'
                  f'，涉及 {len(set(r["pid"] for r in rows))} 首')
            for r in rows:
                print(f'  · {r["pid"]} 卡{r["card_idx"]} [{r["t"]}] {r["len"]}字')
                for h in r['hits']:
                    print(f'      {h["kind"]}({h["dist"]}) 「{h["s1"]}」 ~ 「{h["s2"]}」')
        all_rows.extend(rows)
    if as_json:
        print(json.dumps(all_rows, ensure_ascii=False, indent=1))
    else:
        pct = (grand_hit / grand_tot * 100) if grand_tot else 0
        print(f'合计 {grand_hit}/{grand_tot} 张（{pct:.1f}%）')
    return 0 if grand_hit == 0 else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
