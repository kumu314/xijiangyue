# 外国诗原文抢救 runner（凭据就位后执行）
# 用法: python out/patches/foreign-orig-recovery-run.py
# 前提: D:/AgentHub/temp/wb-r3/deploy-kit/turso.env 两行（TURSO_URL / TURSO_TOKEN），
#       云库 poems 表为七月态（poems 7523 条，与 1.0.2 提审包同源）。
# 行为: 只读拉取 foreign-orig-gap-list.json 中 24 首的云库 lines -> 生成
#       out/patches/foreign-orig-recovery-24.json（web 口径映射: o=中译(七月 m)，m=原文(七月 o)，逐行互换）
#       -> 只出 patch 不应用；应用裁决归枯木/小羽（止血令：两套数据只读）。
# 安全: 只跑 SELECT；凭据不回显、不上黑板；先 SELECT 1 连通性检查。
import json
import os
import sys
import urllib.request

ENV_PATH = 'D:/AgentHub/temp/wb-r3/deploy-kit/turso.env'
GAP_LIST = os.path.join(os.path.dirname(__file__), 'foreign-orig-gap-list.json')
OUT_PATH = os.path.join(os.path.dirname(__file__), 'foreign-orig-recovery-24.json')


def load_env():
    if not os.path.exists(ENV_PATH):
        raise SystemExit('缺凭据文件 %s —— 需枯木重放（或经 Render 控制台重取）' % ENV_PATH)
    env = {}
    for line in open(ENV_PATH, encoding='utf-8'):
        line = line.strip()
        if '=' in line:
            k, v = line.split('=', 1)
            env[k] = v
    if 'TURSO_URL' not in env or 'TURSO_TOKEN' not in env:
        raise SystemExit('turso.env 缺 TURSO_URL 或 TURSO_TOKEN')
    return env


def query(env, sql):
    url = env['TURSO_URL'].rstrip('/') + '/v2/pipeline'
    body = json.dumps({'requests': [{'type': 'execute', 'stmt': {'sql': sql, 'args': []}}, {'type': 'close'}]}).encode()
    req = urllib.request.Request(url, data=body, headers={'Authorization': 'Bearer ' + env['TURSO_TOKEN'], 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.loads(r.read())
    res = d['results'][0]
    if res.get('type') == 'error':
        raise SystemExit('SQL 错误: ' + json.dumps(res.get('error', {}), ensure_ascii=False))
    b = res.get('response', {}).get('result') or res.get('response') or res
    cols = [c['name'] if isinstance(c, dict) else c for c in b.get('cols', [])]
    out = []
    for row in b.get('rows', []):
        out.append({cols[i] if i < len(cols) else 'c%d' % i: (v.get('value') if isinstance(v, dict) else v) for i, v in enumerate(row)})
    return out


def main():
    env = load_env()
    probe = query(env, 'SELECT COUNT(*) AS n FROM poems')
    print('云库 poems 条数:', probe[0]['n'])
    gaps = json.load(open(GAP_LIST, encoding='utf-8'))
    out = {'version': 1, 'generated': '2026-11-05', 'source': 'cloud poems（七月态）',
           'semantic_note': '七月口径 o=原文 m=中译；web 现行口径 o=中译 m=原文 → 回挂时逐行互换',
           'poems': []}
    for g in gaps:
        pid = g['id']
        rows = query(env, "SELECT id, title, lines FROM poems WHERE id = '%s'" % pid)
        if not rows:
            out['poems'].append({'id': pid, 'title': g['title'], 'error': '云库未命中（id 可能随朝代订正变化）'})
            continue
        lines_raw = rows[0].get('lines', '[]')
        lines = json.loads(lines_raw) if isinstance(lines_raw, str) else lines_raw
        out['poems'].append({'id': pid, 'title': g['title'], 'cloud_lines': lines})
    json.dump(out, open(OUT_PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok = sum(1 for p in out['poems'] if 'cloud_lines' in p)
    print('抓取完成: %d/%d 首 -> %s' % (ok, len(gaps), OUT_PATH))


if __name__ == '__main__':
    main()
