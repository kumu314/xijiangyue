# -*- coding: utf-8 -*-
"""候选池计算器（#349）：只算不写，markdown 报告打到 stdout，落盘由 Write 工具完成。

口径：剩余池 = 拓展 + 严格模板 + 原文齐 + 不在网页 - (ALL150 ∪ batch6草稿30)
分类：模板中段 国风·X→国风 / 大雅·小雅→雅 / 含颂→颂 / 其余其他
"""
import json, re, os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chuanjiang_lib import is_template  # noqa: E402

TRUTH = 'D:/WorkBuddyData/WorkBuddy/2026-07-25-14-20-30/poems_new.json'
WEB = 'D:/ZCode/小程序/xijiangyue/index.html'
ALL150 = 'D:/WorkBuddy_output/西江阅云开发/db_import/poems_ALL150_chuanjiang_20261122.jsonl'
B6MJS = 'D:/tmp/write_batch6_chuanjiang.mjs'


def main():
    truth = json.load(open(TRUTH, encoding='utf-8'))
    assert len(truth) == 7523
    web = set(re.findall(r'"id"\s*:\s*"([^"]+)"', open(WEB, encoding='utf-8').read()))
    done = set(json.loads(l)['id'] for l in open(ALL150, encoding='utf-8') if l.strip())
    b6 = set(re.findall(r"'(cp_[0-9a-f]+)'", open(B6MJS, encoding='utf-8').read()))
    assert len(b6) == 30, 'batch6 提取异常 %d' % len(b6)

    pool = []
    for x in truth:
        cur = x.get('串讲', '')
        if x.get('level') != '拓展' or not is_template(cur):
            continue
        if not x.get('lines') or any(not l.get('o') for l in x['lines']):
            continue
        if x['id'] in web or x['id'] in done or x['id'] in b6:
            continue
        au = x.get('author') or ''
        mt = re.match(r'^《.+》，((?:国风|大雅|小雅|周颂|鲁颂|商颂)·[^，]+)，〔', cur)
        if mt:
            seg = mt.group(1)
            if seg.startswith('国风·'):
                cat, sub = '国风', seg[3:]
            elif seg.startswith(('大雅', '小雅')):
                cat, sub = '雅', seg
            else:
                cat, sub = '颂', seg
        else:
            md = re.match(r'^〔([^〕]+)〕', au)
            cat, sub = '其他', (md.group(1) if md else '（无朝代）')
        pool.append((x['id'], x['title'], cat, sub,
                     ''.join((l.get('o') or '') for l in x['lines'])))

    print('POOL=%d' % len(pool))
    for c in ('国风', '雅', '颂', '其他'):
        print('CAT=%s N=%d' % (c, Counter(p[2] for p in pool)[c]))
    for sub, n in sorted(Counter(p[3] for p in pool if p[2] == '国风').items(), key=lambda kv: -kv[1]):
        print('GUOFENG=%s N=%d' % (sub, n))
    for sub, n in sorted(Counter(p[3] for p in pool if p[2] == '其他').items(), key=lambda kv: -kv[1])[:15]:
        print('OTHER=%s N=%d' % (sub, n))
    order = {'国风': 0, '雅': 1, '颂': 2, '其他': 3}
    ranked = sorted(pool, key=lambda p: (order[p[2]], p[3], p[0]))
    for i, (pid, title, cat, sub, o) in enumerate(ranked[:30], 1):
        print('NEXT30|%d|%s|%s|%s|%s|%s' % (i, pid, title, cat, sub, o.replace('|', '∣')[:120]))


if __name__ == '__main__':
    main()
