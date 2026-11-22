# -*- coding: utf-8 -*-
"""串讲量产工具链共享核心（#349 固化自小羽五套手写脚本的检查逻辑）。

本模块只做纯检查，不做任何文件 I/O（I/O 收敛在各 CLI，路径全为字面量）。

硬约束口径（与手写脚本逐条对齐）：
- 前置断言：在库 / level==拓展 / 当前串讲为严格模板(len<=34+正则) / 原文 lines[].o 齐 / 不在网页
- 新串讲：无英文 / 无叹号 / 字数 len() 含标点 90–150 / 「」引用去标点后在 lines[].o 逐字命中
"""
import re

TPL_RE = re.compile(r'^《.+》，((?:国风|大雅|小雅|周颂|鲁颂|商颂)·[^，]+，)?〔[^〕]+〕.+。$')
PUNCT_RE = re.compile(r'[，。？！；：、\s]')
ENG_RE = re.compile(r'[A-Za-z]{2,}')


def norm(s):
    """去标点口径（与 write_batch2_chuanjiang.py 一致）"""
    return PUNCT_RE.sub('', s or '')


def is_template(s):
    """严格模板：len<=34 且《题》，(国风/大雅/小雅/周颂/鲁颂/商颂·X，)?〔朝代〕作者。
    注：#349 工具链勘误——原手写正则只认国风段，漏雅颂变体（如「小雅·鹿鸣之什」）144 首。"""
    return len(s or '') <= 34 and bool(TPL_RE.match(s or ''))


def o_text(x):
    return ''.join((l.get('o') or '') for l in (x.get('lines') or []))


def o_lines_hit(x, qn):
    """同行级命中：引文归一化是否落在单行 o 内（比全诗拼接更严，供 info 报告）"""
    return any(norm(qn) in norm(l.get('o') or '') for l in (x.get('lines') or []))


def check_text(pid, text, x, in_web, skip_pre=False):
    """对一首的新串讲做全部硬约束检查。返回 (errs, infos)。"""
    errs, infos = [], []
    if not x:
        errs.append('%s 不在库' % pid)
        return errs, infos
    if not skip_pre:
        if x.get('level') != '拓展':
            errs.append('%s level!=拓展（%s）' % (pid, x.get('level')))
        cur = x.get('串讲', '')
        if not is_template(cur):
            errs.append('%s 当前非模板串讲: %s' % (pid, cur[:30]))
        if not x.get('lines') or any(not l.get('o') for l in x['lines']):
            errs.append('%s 原文 o 不齐' % pid)
        if in_web:
            errs.append('%s 在网页内（会碰 r7）' % pid)
    if ENG_RE.search(text):
        errs.append('%s 串讲含英文: %s' % (pid, ENG_RE.search(text).group(0)))
    if '！' in text or '!' in text:
        errs.append('%s 串讲含叹号' % pid)
    L = len(text)
    if not (90 <= L <= 150):
        errs.append('%s 长度 %d 越界（要求 90–150 含标点）' % (pid, L))
    quotes = re.findall(r'「([^」]+)」', text)
    ojoin = norm(o_text(x))
    miss = [q for q in quotes if norm(q) not in ojoin]
    if miss:
        errs.append('%s 引用未逐字命中: %s' % (pid, ' | '.join(m[:20] for m in miss)))
    cross = [q for q in quotes if q not in miss and not o_lines_hit(x, norm(q))]
    if cross:
        infos.append('%s 引文跨行命中: %s' % (pid, ' | '.join(c[:20] for c in cross)))
    return errs, infos


def check_batch(texts, byid, webset, skip_pre=False):
    """整批检查。返回 (errs, infos, per)。errs 非空即 FAIL。"""
    errs, infos, per = [], [], []
    for pid in sorted(texts):
        e, i = check_text(pid, texts[pid], byid.get(pid), pid in webset, skip_pre)
        errs += e
        infos += i
        per.append((pid, len(texts[pid]), len(re.findall(r'「([^」]+)」', texts[pid]))))
    return errs, infos, per
