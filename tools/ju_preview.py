#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""菊花图标候选小样生成器（仅用于选型，不参与产品产物）。

为什么需要它：菊花的问题不是「画得丑」而是「读成了太阳」。太阳与菊在 24px 下的
差别只有三处可操作：① 瓣要足够密、彼此挨着（太阳的光线之间是空的）② 瓣要弯、
瓣尖要勾（太阳的线是直的）③ 瓣长要不等（太阳的线等长、轮廓是正圆）。
本脚本把这三个变量参数化，产出多档小样供肉眼比对。

产物：out/r7-ju/preview.html
用法：python tools/ju_preview.py
"""
import pathlib

# 配色（与 index.html 一致）
C = '#8A6220'        # 菊 = var(--gold)
JADE = '#4E6B4A'     # 竹 = var(--jade)
MEI_C = '#A6394F'
LAN_C = '#6A5A92'
SONG_C = '#2F5D45'
WILT = '#8F8577'

# ---------------------------------------------------------------- 花瓣几何
def petal(r0, r1, bend, w, cx=12.0, cy=12.0):
    """一片向上的花瓣：基部距心 r0，瓣尖距心 r1，瓣尖向右偏 bend，半宽 w。

    两个三次贝塞尔：左边上行到瓣尖，右边下行回基部。两段在瓣尖处切线不同 →
    形成一个尖角，尖角 + 偏置就是「瓣尖微卷」的观感来源（太阳不会有这个）。
    """
    bx, by = cx, cy - r0
    tx, ty = cx + bend, cy - r1
    span = r1 - r0
    d = (
        f'M{bx:.2f} {by:.2f}'
        # 左缘：先向左鼓，再收到瓣尖
        f' C{cx - w:.2f} {cy - r0 - span * .30:.2f}'
        f' {cx - w * .90 + bend * .45:.2f} {cy - r1 + span * .24:.2f}'
        f' {tx:.2f} {ty:.2f}'
        # 右缘：从瓣尖回到基部，鼓得更靠外 → 整片瓣顺时针微倾
        f' C{cx + w * 1.18 + bend * .42:.2f} {cy - r1 + span * .28:.2f}'
        f' {cx + w * .98:.2f} {cy - r0 - span * .22:.2f}'
        f' {bx:.2f} {by:.2f} Z'
    )
    return d


def ring(n, r0, r1, bend, w, phase=0.0, cx=12.0, cy=12.0):
    """把一片花瓣绕 (cx,cy) 复制 n 份。phase 是起始角（度），用于让两层错开。"""
    out = []
    for i in range(n):
        a = phase + 360.0 * i / n
        out.append('<path d="%s" transform="rotate(%.3f %.2f %.2f)"/>'
                   % (petal(r0, r1, bend, w, cx, cy), a, cx, cy))
    return '\n      '.join(out)


def head(cx, cy, rings, disc=1.0):
    """花头 = 若干同心层花瓣 + 中心一点。rings 元素：(n, r0, r1, bend, w, phase)。"""
    parts = []
    for (n, r0, r1, bend, w, phase) in rings:
        parts.append('<g fill="%s">\n      %s\n    </g>'
                     % (C, ring(n, r0, r1, bend, w, phase, cx, cy)))
    if disc:
        parts.append('<circle cx="%.2f" cy="%.2f" r="%.2f" fill="%s"/>' % (cx, cy, disc, C))
    return '\n    '.join(parts)


# ---------------------------------------------------------------- 候选
# 结论先行：A/B/C 三版都只能做成「360° 放射」，而 24px 下 360° 放射必然读成太阳。
# 根因不是画得不好，是「轮廓」上没信息 —— 梅靠团块、兰靠扇形、松靠三角、竹靠竖线立住，
# 菊花头的正圆轮廓信息量为零。所以 D/E/F 改走折枝形态：用茎把轮廓定住。

def cand_D():
    """折枝菊：正面重瓣花头（外 12 内 8）+ 直茎 + 一片尖叶。"""
    return f'''{head(12, 7.6, [(12, 1.4, 6.2, .90, 1.05, 0), (8, .9, 3.9, .72, .85, 15)], disc=1.0)}
    <path d="M12 13.4 V21.6" stroke="{C}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M12.5 17.5 C14.6 15.5 17.3 15.1 19.4 15.9 C17.5 18.0 14.8 18.6 12.5 17.5 Z" fill="{C}"/>'''


def cand_E():
    """折枝菊·胖瓣：花头瓣更少更胖（外 10 内 7），茎旁一叶带一小齿。"""
    return f'''{head(12, 7.8, [(10, 1.5, 6.4, 1.00, 1.28, 0), (7, 1.0, 4.1, .80, 1.02, 25)], disc=1.05)}
    <path d="M12 14.2 V21.6" stroke="{C}" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M12.4 18.6 C14.4 16.5 17.2 16.0 19.2 16.8 C18.4 17.7 17.9 18.4 17.6 19.4 C16.0 19.6 14.0 19.4 12.4 18.6 Z" fill="{C}"/>'''


def cand_F():
    """乒乓菊：360° 但瓣短胖、长度不齐、边缘毛糙（不经茎，看纯花头能否立住）。"""
    parts = ['<g fill="%s">' % C]
    for i in range(15):
        a = 24.0 * i
        r1 = 8.6 if i % 2 else 9.8          # 长度不等 → 轮廓不是正圆
        w = 1.55 if i % 2 else 1.35
        parts.append('  <path d="%s" transform="rotate(%.3f 12 12)"/>'
                     % (petal(2.6, r1, .7, w), a))
    parts.append('</g>')
    parts.append('<g fill="%s">' % C)
    for i in range(11):
        a = 11.0 + 360.0 * i / 11
        parts.append('  <path d="%s" transform="rotate(%.3f 12 12)"/>'
                     % (petal(1.4, 5.4, .55, 1.15), a))
    parts.append('</g>')
    parts.append('<circle cx="12" cy="12" r="1.1" fill="%s"/>' % C)
    return '\n    '.join(parts)


CANDS = [('D 折枝菊·细瓣', cand_D()), ('E 折枝菊·胖瓣', cand_E()), ('F 乒乓菊·无茎', cand_F())]

# ---------------------------------------------------------------- 现有四形（对照组）
MEI = '''<g fill="currentColor">
    <circle cx="12" cy="6.6" r="3.15"/><circle cx="17.3" cy="10.4" r="3.15"/>
    <circle cx="15.3" cy="16.6" r="3.15"/><circle cx="8.7" cy="16.6" r="3.15"/>
    <circle cx="6.7" cy="10.4" r="3.15"/>
  </g>
  <circle cx="12" cy="12.2" r="1.75" fill="#FBF6EA"/>
  <g fill="currentColor"><circle cx="12" cy="11.6" r=".42"/><circle cx="11.3" cy="12.4" r=".42"/><circle cx="12.7" cy="12.4" r=".42"/></g>'''

LAN = '''<g fill="none" stroke="currentColor" stroke-linecap="round">
    <path d="M11.4 21.8 C9.2 16.6 5.9 11.9 2.2 8.6" stroke-width="2.05"/>
    <path d="M11.4 21.8 C12.5 15.2 11.7 8.4 9.1 2.9" stroke-width="2.05"/>
    <path d="M11.4 21.8 C13.6 16.9 16.7 12.4 21.2 9.2" stroke-width="2.05"/>
    <path d="M11.4 21.8 C10.9 18.1 9 14.6 6.5 11.9" stroke-width="1.55"/>
    <path d="M12.3 13.2 C13.6 9.9 15.5 7.1 18 4.8" stroke-width="1.3"/>
  </g>
  <ellipse cx="18.8" cy="3.9" rx="1.65" ry="1.2" transform="rotate(-32 18.8 3.9)" fill="currentColor"/>'''

ZHU = '''<g fill="none" stroke="currentColor" stroke-width="2.35" stroke-linecap="butt">
    <path d="M10.5 21.4 V16.5"/><path d="M10.5 15 V10.5"/><path d="M10.5 9 V4.4"/>
  </g>
  <g fill="currentColor">
    <path d="M11 9.2 C13.7 5.4 17.3 3.7 21.2 3.8 C18 6.6 14.6 8.4 11 9.2 Z"/>
    <path d="M11 14 C13.9 11.5 17.4 10.5 20.9 10.9 C17.7 13.1 14.4 14.2 11 14 Z"/>
    <path d="M10.2 6.3 C7.9 3.2 5.1 1.7 2 1.8 C4.7 4.1 7.4 5.8 10.2 6.3 Z"/>
  </g>'''

SONG = '''<g fill="currentColor">
    <path d="M12 3.2 L7.7 10.3 H16.3 Z"/>
    <path d="M12 8.5 L5.4 17.2 H18.6 Z"/>
  </g>
  <path d="M12 17.2 V21.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'''

C = '#8A6220'
JADE = '#4E6B4A'
MEI_C = '#A6394F'
LAN_C = '#6A5A92'
SONG_C = '#2F5D45'
WILT = '#8F8577'


def svg(inner, color, size):
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" '
            f'style="color:{color};display:block">{inner}</svg>')


def row(title, inner):
    cells = []
    for size in (24, 32, 48, 96):
        for color, tag in ((C, '生'), (WILT, '枯')):
            cells.append(f'<div class="cell"><div class="s">{svg(inner, color, size)}</div>'
                         f'<div class="l">{size}px {tag}</div></div>')
    return f'<div class="row"><div class="h">{title}</div><div class="cells">{"".join(cells)}</div></div>'


def pixel_truth(inner, color, zoom=8):
    """24px 的「像素真相」：container 里只放 data-src，由页面 JS 走 canvas 强制光栅。

    为什么不能直接用 <img width=24 style=width:192px;image-rendering:pixelated>：
    SVG 是分辨率无关的，浏览器会按「显示尺寸 192px」重新光栅化，pixelated 没有
    低分辨率位图可采样 —— 看到还是清晰版。唯一可靠做法是 canvas 先 drawImage
    到 24×24、再关掉插值放大。矢量图放大到 96px 看形也是在自欺。
    """
    import base64
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
           f'width="24" height="24"><g color="{color}">{inner.replace("currentColor", color)}</g></svg>')
    b64 = base64.b64encode(svg.encode('utf-8')).decode('ascii')
    return (f'<div class="px-canvas" data-src="data:image/svg+xml;base64,{b64}" '
            f'data-zoom="{zoom}"></div>')


def main():
    rows = []
    for name, inner in CANDS:
        rows.append(row(name, inner))
    controls = [('对照·梅', MEI.replace('currentColor', MEI_C)),
                ('对照·兰', LAN.replace('currentColor', LAN_C)),
                ('对照·竹', ZHU.replace('currentColor', JADE)),
                ('对照·松', SONG.replace('currentColor', SONG_C))]
    for name, inner in controls:
        rows.append(row(name, inner))

    # 像素真相区：只用 24px 光栅，放大 8 倍
    px = [f'<div class="px-cell"><div class="s">{pixel_truth(inner, C if i < len(CANDS) else cc)}</div>'
          f'<div class="l">{name}</div></div>'
          for i, ((name, inner), cc) in enumerate(
              zip(CANDS + controls, [C] * len(CANDS) + [MEI_C, LAN_C, JADE, SONG_C]))]

    html = f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>菊花候选小样</title>
<style>
  body{{margin:0;padding:24px 28px;background:#FBF6EA;
        font:13px/1.6 "LXGW WenKai","Kaiti SC","STKaiti",KaiTi,serif;color:#2B2620}}
  h1{{font-size:16px;margin:0 0 4px;font-weight:600}}
  h2{{font-size:14px;margin:26px 0 2px;font-weight:600}}
  .note{{color:#6B6357;margin:0 0 18px;font-size:12px}}
  .row{{display:flex;align-items:center;gap:18px;padding:10px 0;border-top:1px solid #E7DFCE}}
  .h{{flex:0 0 108px;font-weight:600}}
  .cells{{display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap}}
  .cell{{display:flex;flex-direction:column;align-items:center;gap:4px}}
  .s{{background:#F3ECDD;border:1px solid #E7DFCE;border-radius:6px;padding:8px;
      display:flex;align-items:center;justify-content:center}}
  .l{{font-size:10px;color:#8C8478;letter-spacing:.02em}}
  .px-grid{{display:flex;gap:26px;flex-wrap:wrap;padding:12px 0 4px;border-top:1px solid #E7DFCE}}
  .px-cell{{display:flex;flex-direction:column;align-items:center;gap:8px}}
</style></head><body>
<h1>菊花候选小样</h1>
<h2>① 各尺寸对照（矢量放大，仅供看形）</h2>
<p class="note">判据：能否一眼读出「菊」，且与梅的团块、松的三角、兰的扇形不混淆。</p>
{''.join(rows)}
<h2>② 像素真相 · 24px 光栅放大 8 倍</h2>
<p class="note">这才是真机上 24px 真正长成的样子。上面的 96px 会骗人。</p>
<div class="px-grid">{''.join(px)}</div>
<script>
(async () => {{
  const cells = [...document.querySelectorAll('.px-canvas')];
  await Promise.all(cells.map(c => new Promise(res => {{
    const zoom = +c.dataset.zoom || 8;
    const img = new Image();
    img.onload = () => {{
      const small = document.createElement('canvas');
      small.width = small.height = 24;
      const sc = small.getContext('2d');
      sc.drawImage(img, 0, 0, 24, 24);          // 真·24px 光栅化
      const big = document.createElement('canvas');
      big.width = big.height = 24 * zoom;
      const bc = big.getContext('2d');
      bc.imageSmoothingEnabled = false;         // 关插值，看到的就是像素块
      bc.drawImage(small, 0, 0, big.width, big.height);
      big.style.width = (24 * zoom) + 'px';
      big.style.display = 'block';
      c.appendChild(big);
      res();
    }};
    img.onerror = () => {{ c.textContent = 'PNG-ERR'; res(); }};
    img.src = c.dataset.src;
  }})));
  window.__PX_DONE__ = cells.length;
}})();
</script>
</body></html>'''
    p = pathlib.Path(__file__).resolve().parent.parent / 'out' / 'r7-ju' / 'preview.html'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(html, encoding='utf-8')
    print('✓ %s' % p)


if __name__ == '__main__':
    main()
