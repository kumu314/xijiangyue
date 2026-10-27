#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把选定的菊花稿写回 index.html 的 <symbol id="plant-ju">。

决策史（别再来回翻）：
· 2026-10-27 第一版：8 根放射直线 + 圆 → 枯木「像太阳」。
· 2026-10-27 第二版：改「折枝」（重瓣花头 + 竖直茎 + 叶），靠茎把轮廓定住，24px 最清楚。
  但枯木 10-28 看了候选图说「菊花，这个就可以」，选的是**无茎的花头稿**（F 乒乓菊）。
· 2026-10-28 第三版（当前）：按 F 的形做 24px 适配 = F1（10 外瓣 + 7 内瓣 + 实心花心 1.9）。
  F 原稿是 15+11+小圆点，96px 极像菊，但 24px 下每个元素只剩约 1px，被抗锯齿糊成一团星芒
  （实测见 out/r7-ju/duel.png）。F1 把元素从 26 个砍到 18 个、瓣加粗，24px 下瓣与瓣仍分得开。

用法：
  python tools/apply_ju_symbol.py --dry     # 只打印，不改文件
  python tools/apply_ju_symbol.py           # 写回 index.html
"""
import argparse
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ju_preview import C  # noqa: E402
from ju_fix import F1  # noqa: E402

BEGIN = '<symbol id="plant-ju" viewBox="0 0 24 24">'
END = '</symbol>'


def build() -> str:
    body = F1().replace(C, 'currentColor')
    return f'{BEGIN}\n  {body}\n{END}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', default='index.html')
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()

    block = build()
    p = pathlib.Path(a.html)
    html = p.read_text(encoding='utf-8')

    pat = re.compile(re.escape(BEGIN) + r'.*?' + re.escape(END), re.S)
    if not pat.search(html):
        sys.exit('✗ 找不到 <symbol id="plant-ju">，中止')
    if a.dry:
        print(block)
        return

    html = pat.sub(lambda m: block, html, count=1)
    p.write_text(html, encoding='utf-8')
    print('✓ %s 已更新 plant-ju（F1：10 外瓣 + 7 内瓣 + 花心，无茎）' % p)


if __name__ == '__main__':
    main()
