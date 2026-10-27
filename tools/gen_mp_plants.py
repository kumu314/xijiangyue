#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把桌面 index.html 里的「五清」植物 <symbol> 派生为小程序 WXSS 的底色图。

为什么要生成而不用手写两份：植物的「形」只能有一个真值源，否则两端迟早走样。
真值源 = index.html 中 <symbol id="plant-mei|lan|zhu|ju|song" viewBox="0 0 24 24"> 的内容。
本脚本读它、把 currentColor 换成具体色、base64 后写进 learn.wxss 的标记区内。

小程序为什么用 background-image 而不是 <image> 或 <svg>：
  小程序 WXML 不支持 <svg>；<image> 对 SVG data URI 的支持在 iOS 上有版本坑。
  WXSS 的 background-image 走 WebView 渲染，base64 SVG 在 iOS/Android 都稳。
  ⚠ 仍属「需真机验证」项，见交付报告。

用法：
  python tools/gen_mp_plants.py --html index.html --wxss <path>/pages/learn/learn.wxss
重复运行安全（标记区整段替换）。
"""
import argparse, base64, re, sys, pathlib

# 与 index.html :root 的 --p-* / --jade / --gold 一一对应，改色请两边一起改
COLORS = {
    'mei': '#A6394F',   # 梅 胭脂
    'lan': '#6A5A92',   # 兰 紫
    'zhu': '#4E6B4A',   # 竹 = var(--jade)
    'ju':  '#8A6220',   # 菊 = var(--gold)
    'song': '#2F5D45',  # 松 墨绿
}
WILT = '#8F8577'        # 枯灰（3.36:1，见 index.html 注释）
ORDER = ['mei', 'lan', 'zhu', 'ju', 'song']

BEGIN = '/* ===== BEGIN 五清植物（由 tools/gen_mp_plants.py 生成，勿手改）=====' 
END = '/* ===== END 五清植物 ===== */'


def extract_symbols(html: str) -> dict:
    out = {}
    for k in ORDER:
        m = re.search(r'<symbol id="plant-%s" viewBox="0 0 24 24">(.*?)</symbol>' % k, html, re.S)
        if not m:
            sys.exit('✗ 在 index.html 里找不到 <symbol id="plant-%s">，生成中止' % k)
        out[k] = m.group(1).strip()
    return out


def to_data_uri(inner: str, color: str) -> str:
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'
           + inner.replace('currentColor', color) + '</svg>')
    return 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode('utf-8')).decode('ascii')


def build_wxss(symbols: dict) -> str:
    lines = [BEGIN,
             '   五清打卡图标：形取自 index.html 的同名 <symbol>，此处只换成具体色 + base64。',
             '   未打卡＝枯灰 + 下垂；打卡＝本色 + 直立。姿态与颜色双信号，不只靠颜色。',
             '   ⚠ 真机需验证 background-image 的 base64 SVG 是否正常渲染（见交付报告未检查项）。 */',
             '.ck { background-repeat: no-repeat; background-position: center; background-size: 100% 100%;',
             '      transform: rotate(-9deg) scale(.9); transform-origin: 50% 94%;',
             '      transition: transform .42s cubic-bezier(.2,.9,.3,1.18); }',
             '.ci-item.done .ck { transform: rotate(0) scale(1); }',
             '.ci-item.fx .ck { animation: plantBloomMp .52s cubic-bezier(.2,.9,.3,1.25) both; }',
             '@keyframes plantBloomMp {',
             '  0% { transform: rotate(-11deg) scale(.62); }',
             '  58% { transform: rotate(2deg) scale(1.1); }',
             '  100% { transform: rotate(0) scale(1); }',
             '}']
    for k in ORDER:
        lines.append('.ck.p-%s { background-image: url("%s"); }' % (k, to_data_uri(symbols[k], WILT)))
        lines.append('.ci-item.done .ck.p-%s { background-image: url("%s"); }' % (k, to_data_uri(symbols[k], COLORS[k])))
    lines.append(END)
    return '\n'.join(lines) + '\n'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--html', default='index.html')
    ap.add_argument('--wxss', required=True)
    a = ap.parse_args()

    html = pathlib.Path(a.html).read_text(encoding='utf-8')
    symbols = extract_symbols(html)
    block = build_wxss(symbols)

    p = pathlib.Path(a.wxss)
    css = p.read_text(encoding='utf-8')
    if BEGIN in css and END in css:
        css = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END), block.rstrip(), css, flags=re.S)
        mode = '替换标记区'
    else:
        css = css.rstrip() + '\n\n' + block
        mode = '追加到末尾'
    p.write_text(css, encoding='utf-8')
    print('✓ %s（%s）；5 形 × 2 态 = 10 条背景图' % (p, mode))
    for k in ORDER:
        print('   - %-4s 枯 %s / 生 %s' % (k, WILT, COLORS[k]))


if __name__ == '__main__':
    main()
