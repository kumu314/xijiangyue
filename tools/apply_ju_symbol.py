#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把选定的菊花稿（候选 D · 折枝菊）写回 index.html 的 <symbol id="plant-ju">。

为什么用脚本而不是手敲：这个 symbol 有 20 片花瓣，每片都要一个 rotate 坐标，
手抄一次就可能错一位，而错了不会报错、只会悄悄变形。由 petal/ring/head 现算，
几何只有一份真值源。

用法：
  python tools/apply_ju_symbol.py --dry     # 只打印，不改文件
  python tools/apply_ju_symbol.py           # 写回 index.html
"""
import argparse
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ju_preview import C, head  # noqa: E402

BEGIN = '<symbol id="plant-ju" viewBox="0 0 24 24">'
END = '</symbol>'


def build() -> str:
    """折枝菊：正面重瓣花头（外 12 / 内 8）+ 直茎 + 一片尖叶。

    为什么带茎（本轮返工的根因）：纯 360° 放射在 24px 光栅下必然读成太阳/星芒。
    四条已有植物都靠「轮廓性质」立住 —— 梅=团块、兰=扇形、松=三角、竹=竖线；
    菊花头的正圆轮廓信息量为零，只能靠茎+叶把轮廓定成「折枝」。
    实测截图见 out/r7-ju/pixel.png（24px 光栅放大 8 倍）。
    """
    body = head(12, 7.6, [(12, 1.4, 6.2, .90, 1.05, 0), (8, .9, 3.9, .72, .85, 15)], disc=1.0)
    body = body.replace(C, 'currentColor')
    return (f'{BEGIN}\n'
            f'  {body}\n'
            f'  <path d="M12 13.2 V21.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>\n'
            f'  <path d="M12.5 17.2 C14.6 15.2 17.3 14.8 19.4 15.6 C17.5 17.7 14.8 18.3 12.5 17.2 Z" fill="currentColor"/>\n'
            f'{END}')


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
    print('✓ %s 已更新 plant-ju（%d 片花瓣 + 茎 + 叶）'
          % (p, block.count('<path')))


if __name__ == '__main__':
    main()
