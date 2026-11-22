# -*- coding: utf-8 -*-
"""串讲批次三查工具（#349）：check=写入前全断言 / verify=导入包后置校验。

用法：
  python chuanjiang-check.py check  <draft.json>   # 写入前：前置断言+字数+引用；draft={"batch":..,"texts":{id:text}}
  python chuanjiang-check.py verify <pkg.jsonl>    # 导入包后置：行数/唯一id/_id==id/串讲==真值源/字数/引用
退出码：全过 0，任一 FAIL 1。
"""
import json, re, sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chuanjiang_lib import check_batch  # noqa: E402

TRUTH = 'D:/WorkBuddyData/WorkBuddy/2026-07-25-14-20-30/poems_new.json'
WEB = 'D:/ZCode/小程序/xijiangyue/index.html'


def load_jsonl(path):
    rows = []
    with open(path, encoding='utf-8') as f:
        for ln in f:
            ln = ln.strip()
            if ln:
                rows.append(json.loads(ln))
    return rows


def main():
    mode, path = sys.argv[1], sys.argv[2]
    truth = json.load(open(TRUTH, encoding='utf-8'))
    assert len(truth) == 7523, '真值源总数异常 %d' % len(truth)
    byid = {x['id']: x for x in truth}
    web = set(re.findall(r'"id"\s*:\s*"([^"]+)"', open(WEB, encoding='utf-8').read()))

    if mode == 'check':
        draft = json.load(open(path, encoding='utf-8'))
        texts = draft['texts']
        errs, infos, per = check_batch(texts, byid, web, skip_pre=False)
        print('=== 前置断言 + 内容硬约束（%d 首） ===' % len(texts))
        for pid, L, nq in per:
            print('%s  %d字  引%d处' % (pid, L, nq))
        for i in infos:
            print('INFO', i)
        if errs:
            print('FAIL %d 项' % len(errs))
            for e in errs:
                print('  ERR', e)
            sys.exit(1)
        print('PASS %d/%d' % (len(texts), len(texts)))

    elif mode == 'verify':
        rows = load_jsonl(path)
        texts = {r['id']: r.get('串讲', '') for r in rows}
        errs, infos, per = [], [], []
        # 包结构断言
        ids = [r['id'] for r in rows]
        if len(set(ids)) != len(ids):
            errs.append('包内 id 重复 %d/%d' % (len(set(ids)), len(ids)))
        bad = [r['id'] for r in rows if r.get('_id') != r.get('id')]
        if bad:
            errs.append('_id!=id: %s' % ', '.join(bad[:5]))
        # 串讲与真值源逐字一致
        notin = [i for i in ids if i not in byid]
        if notin:
            errs.append('id 不在真值源: %s' % ', '.join(notin[:5]))
        mism = [r['id'] for r in rows if r['id'] in byid and r.get('串讲') != byid[r['id']].get('串讲')]
        if mism:
            errs.append('串讲与真值源不符: %s' % ', '.join(mism[:5]))
        # 内容硬约束（字数/引用/无英文/无叹号，跳过前置模板断言——已写入态）
        e2, infos, per = check_batch(texts, byid, web, skip_pre=True)
        errs += e2
        print('=== 导入包后置校验（%d 行） ===' % len(rows))
        print('行数=%d 唯一id=%d _id==id=%d/%d 串讲==真值源=%d/%d' % (
            len(rows), len(set(ids)), sum(1 for r in rows if r.get('_id') == r.get('id')), len(rows),
            len(rows) - len([r for r in rows if r['id'] in byid and r.get('串讲') != byid[r['id']].get('串讲')]), len(rows)))
        for i in infos:
            print('INFO', i)
        if errs:
            print('FAIL %d 项' % len(errs))
            for e in errs:
                print('  ERR', e)
            sys.exit(1)
        print('PASS %d/%d' % (len(rows), len(rows)))

    elif mode == 'gen':
        # 增量 Upsert 清单生成：python chuanjiang-check.py gen <ids.txt>（stdout 即 jsonl，重定向落盘）
        ids = [l.strip() for l in open(path, encoding='utf-8') if l.strip()]
        assert ids, 'ids 文件为空'
        assert not [i for i in ids if i not in byid], 'id 不在真值源'
        parts = ['D:/WorkBuddy_output/西江阅云开发/db_import/poems_part%d.jsonl' % n for n in range(1, 8)]
        base = {}
        for pth in parts:
            for ln in open(pth, encoding='utf-8'):
                try:
                    r = json.loads(ln)
                except ValueError:
                    continue
                if isinstance(r, dict) and r.get('id') in set(ids):
                    base[r['id']] = r
        assert not [i for i in ids if i not in base], 'id 不在云包记录'
        for i in ids:
            r = dict(base[i])
            r['串讲'] = byid[i]['串讲']
            assert r.get('_id') == i, i + ' _id 异常'
            assert [k for k in base[i] if base[i][k] != r.get(k)] == ['串讲'], i + ' 越界字段'
            sys.stdout.write(json.dumps(r, ensure_ascii=False, separators=(',', ':')) + '\n')

    elif mode == 'merge':
        # 批次合并：python chuanjiang-check.py merge <f1> <f2> ...（stdout 即合并 jsonl）
        # 断言：每片行数一致、全库唯一、_id==id、串讲==真值源；字段级差异（除串讲/_id）应为 0
        plist = sys.argv[2:]
        assert len(plist) >= 2, '至少两个批次文件'
        allrows, seen = [], {}
        for fn in plist:
            rows = load_jsonl(fn)
            assert len(rows) == len(load_jsonl(plist[0])), fn + ' 行数与首片不一致'
            for r in rows:
                pid = r['id']
                assert pid not in seen, '跨批重复 id ' + pid
                assert r.get('_id') == pid, fn + ' _id!=id: ' + pid
                assert pid in byid, fn + ' id 不在真值源: ' + pid
                assert r['串讲'] == byid[pid]['串讲'], fn + ' 串讲与真值源不符: ' + pid
                seen[pid] = fn
                allrows.append(r)
        diff_field = 0
        for r in allrows:
            t = byid[r['id']]
            for k in set(r.keys()) | set(t.keys()):
                if k != '_id' and r.get(k) != t.get(k):
                    diff_field += 1
        sys.stderr.write('merge: %d 行 / 唯一 %d / 字段级差异(除串讲/_id)=%d\n' % (
            len(allrows), len(seen), diff_field))
        for r in allrows:
            sys.stdout.write(json.dumps(r, ensure_ascii=False, separators=(',', ':')) + '\n')

    else:
        print('未知模式: %s（check|verify|gen|merge）' % mode)
        sys.exit(2)


if __name__ == '__main__':
    main()
