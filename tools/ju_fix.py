#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""菊花 F 稿（枯木 10-28 选定：乒乓菊·无茎）的 24px 适配版对比。

为什么还要再出一版：F 在 96px 是漂亮的重瓣菊，但 15 外瓣 + 11 内瓣挤在 24px 里，
每个元素只剩约 1px，抗锯齿把它们糊成一团星芒 —— 正是枯木最早说「像太阳」的观感。
解决方向不是改构图（枯木已选定花头朝上、无茎），而是**减元素、加粗瓣、实心花心**，
让 24px 下每片瓣还占得到 2px、瓣与瓣之间还留得出 1px 空隙。

产物：out/r7-ju/pick.html（96px 原样 + 24px 光栅真相，10 倍）
用法：python tools/ju_fix.py && node out/r7-ju/pick.cjs
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from ju_preview import C, WILT, head, petal  # noqa: E402

CX = CY = 12.0


def F_origin():
    """枯木选定的原稿 F（15 外 + 11 内 + 小圆点）—— 不达标也要摆出来当基准。"""
    parts = ['<g fill="%s">' % C]
    for i in range(15):
        r1 = 8.6 if i % 2 else 9.8
        w = 1.55 if i % 2 else 1.35
        parts.append('  <path d="%s" transform="rotate(%.3f 12 12)"/>'
                     % (petal(2.6, r1, .7, w), 24.0 * i))
    parts.append('</g>')
    parts.append('<g fill="%s">' % C)
    for i in range(11):
        parts.append('  <path d="%s" transform="rotate(%.3f 12 12)"/>'
                     % (petal(1.4, 5.4, .55, 1.15), 11.0 + 360.0 * i / 11))
    parts.append('</g>')
    parts.append('<circle cx="12" cy="12" r="1.1" fill="%s"/>' % C)
    return '\n    '.join(parts)


def F1():
    """10 外 + 7 内 + 花心 1.9 —— 保留双层，先把元素从 26 个砍到 18 个。"""
    return head(12, 12, [(10, 3.0, 9.6, .55, 1.75, 0), (7, 1.8, 5.2, .45, 1.30, 25.7)], disc=1.9)


def F2():
    """8 外（胖）+ 6 内 + 花心 2.1 —— 瓣更少更粗，24px 下瓣间空隙约 2px。"""
    return head(12, 12, [(8, 3.0, 9.4, .5, 2.45, 0), (6, 1.9, 5.0, .4, 1.60, 30)], disc=2.1)


def F3():
    """9 外（单层）+ 花心 2.2 —— 最简：去掉内圈，靠实心花心撑出层次。"""
    return head(12, 12, [(9, 2.6, 9.5, .5, 2.20, 0)], disc=2.2)


CANDS = [
    ('F 原稿（你选的）', F_origin(), '15 外 + 11 内，96px 最好看，24px 会糊'),
    ('F1 十瓣双层', F1(), '10 外 + 7 内 + 实心花心'),
    ('F2 八瓣胖瓣', F2(), '8 外（粗）+ 6 内，瓣间空隙最大'),
    ('F3 九瓣单层', F3(), '9 外 + 大花心，最简'),
]


def svg(inner, color, size):
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" '
            f'style="color:{color};display:block">{inner.replace("currentColor", color)}</svg>')


def px_block(inner, color, zoom=10):
    """24px 像素真相：canvas 强制光栅 24×24 再放大，SVG 矢量放大是自欺。"""
    import base64
    s = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">'
         + inner.replace('currentColor', color) + '</svg>')
    b64 = base64.b64encode(s.encode('utf-8')).decode('ascii')
    return f'<div class="px-canvas" data-src="data:image/svg+xml;base64,{b64}" data-zoom="{zoom}"></div>'


def main():
    rows = []
    # 决胜区：只摆 24px 真实像素，放大 12 倍，一行看完
    duel = ''.join(
        f'<div class="duel-cell"><div class="s">{px_block(inner, C, 12)}</div>'
        f'<div class="l">{name}</div></div>'
        for name, inner, _ in CANDS)

    for name, inner, note in CANDS:
        rows.append(f'''<div class="row">
  <div class="h">{name}<span class="n">{note}</span></div>
  <div class="cells">
    <div class="cell"><div class="s">{svg(inner, C, 96)}</div><div class="l">96px 生</div></div>
    <div class="cell"><div class="s">{svg(inner, WILT, 96)}</div><div class="l">96px 枯</div></div>
    <div class="cell"><div class="s">{px_block(inner, C)}</div><div class="l">24px 真实像素</div></div>
    <div class="cell"><div class="s">{px_block(inner, WILT)}</div><div class="l">24px 枯</div></div>
  </div>
</div>''')

    html = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>菊花 F 稿 24px 适配</title>
<style>
  body{{margin:0;padding:22px 26px;background:#FBF6EA;
        font:13px/1.6 "LXGW WenKai","Kaiti SC","STKaiti",KaiTi,serif;color:#2B2620}}
  h1{{font-size:16px;margin:0 0 4px;font-weight:600}}
  h2{{font-size:14px;margin:20px 0 2px;font-weight:600}}
  .note{{color:#6B6357;margin:0 0 12px;font-size:12px}}
  .duel{{display:flex;gap:20px;align-items:flex-end;padding:12px 0 6px;flex-wrap:wrap}}
  .duel-cell{{display:flex;flex-direction:column;align-items:center;gap:6px}}
  .duel-cell .s{{background:#F3ECDD;border:1px solid #E7DFCE;border-radius:6px;padding:6px;
      display:flex;align-items:center;justify-content:center}}
  .row{{display:flex;align-items:center;gap:20px;padding:12px 0;border-top:1px solid #E7DFCE}}
  .h{{flex:0 0 150px;font-weight:600}}
  .h .n{{display:block;font-weight:400;font-size:11px;color:#8C8478;margin-top:2px}}
  .cells{{display:flex;gap:16px;align-items:flex-end;flex-wrap:wrap}}
  .cell{{display:flex;flex-direction:column;align-items:center;gap:5px}}
  .s{{background:#F3ECDD;border:1px solid #E7DFCE;border-radius:6px;padding:8px;
      display:flex;align-items:center;justify-content:center;min-width:112px;min-height:112px}}
  .l{{font-size:10px;color:#8C8478}}
  canvas{{display:block}}
</style></head><body>
<h1>菊花 F 稿 24px 适配对比</h1>
<h2>① 决胜区：只比 24px 真实像素（放大 12 倍）</h2>
<p class="note">这才是真机上的长相。96px 会把 24px 丢掉的细节全还回来，别用它判断。</p>
<div class="duel">{duel}</div>
<h2>② 完整对照（96px 生/枯 + 24px 生/枯）</h2>
{''.join(rows)}
<script>
(async () => {{
  const cells = [...document.querySelectorAll('.px-canvas')];
  await Promise.all(cells.map(c => new Promise(res => {{
    const zoom = +c.dataset.zoom || 10;
    const img = new Image();
    img.onload = () => {{
      const small = document.createElement('canvas');
      small.width = small.height = 24;
      small.getContext('2d').drawImage(img, 0, 0, 24, 24);
      const big = document.createElement('canvas');
      big.width = big.height = 24 * zoom;
      const bc = big.getContext('2d');
      bc.imageSmoothingEnabled = false;
      bc.drawImage(small, 0, 0, big.width, big.height);
      c.appendChild(big); res();
    }};
    img.onerror = () => {{ c.textContent = 'ERR'; res(); }};
    img.src = c.dataset.src;
  }})));
  window.__PX_DONE__ = cells.length;
}})();
</script>
</body></html>'''
    p = pathlib.Path(__file__).resolve().parent.parent / 'out' / 'r7-ju' / 'pick.html'
    p.write_text(html, encoding='utf-8')
    print('✓ %s' % p)


if __name__ == '__main__':
    main()
