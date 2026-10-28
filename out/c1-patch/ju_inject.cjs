/* #239 复核 · 菊花三条判据的反向注入探针
   把同一段判据代码分别跑在四个历史形态上，看它能不能逐个拦住。
   判据代码逐字取自 tests/r7-texture-test.mjs（9414210 版）L840-889。 */
const { chromium } = require('playwright-core');
const fs = require('fs');

const CASES = [
  ['r6       (f1e0529^，无五清植物)', 'D:/AgentHub/temp/r7-review/index-r6.html'],
  ['太阳版   (f1e0529)', 'D:/AgentHub/temp/r7-review/index-taiyang.html'],
  ['折枝版   (888cea4，当前 main)', 'D:/AgentHub/temp/r7-review/index-888cea4.html'],
  ['F1 适配  (9414210，工作区)', 'D:/ZCode/小程序/xijiangyue/index.html'],
  ['★12光线(圆心起·宽间隙)对抗样本', 'D:/AgentHub/temp/r7-review/index-fakesun2.html'],
];

(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const rows = [];
  for (const [label, file] of CASES) {
    if (!fs.existsSync(file)) { rows.push({ label, err: '缺文件' }); continue; }
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto('file:///' + file.replace(/\\/g, '/'));
    await p.waitForTimeout(500);
    const r = await p.evaluate(async () => {
      const sym = document.querySelector('#plant-ju');
      if (!sym) return { noSymbol: true };
      const paths = [...sym.querySelectorAll('path')];
      const nStroked = (sym.innerHTML.match(/stroke=/g) || []).length;
      const nFilled = paths.filter(x => !x.getAttribute('stroke')).length;
      // 宽高比：直接用 symbol 内容在 24x24 viewBox 下的 bbox
      let bb = null;
      try {
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.style.position = 'absolute'; svg.style.opacity = '0';
        use.setAttribute('href', '#plant-ju');
        svg.appendChild(use); document.body.appendChild(svg);
        const bb2 = use.getBBox(); bb = { w: +bb2.width.toFixed(2), h: +bb2.height.toFixed(2) };
        svg.remove();
      } catch (e) { bb = null; }
      // c) 24px 光栅 r=4 圆周深色段数（逐字复刻）
      const src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">'
        + '<g color="#000">' + sym.innerHTML + '</g></svg>';
      const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
      let segs = -1;
      try {
        const img = await new Promise((res, rej) => {
          const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
        });
        const cv = document.createElement('canvas'); cv.width = cv.height = 24;
        const cx2 = cv.getContext('2d'); cx2.drawImage(img, 0, 0, 24, 24);
        const d = cx2.getImageData(0, 0, 24, 24).data;
        const at = (x, y) => {
          const xi = Math.round(x), yi = Math.round(y);
          if (xi < 0 || yi < 0 || xi > 23 || yi > 23) return false;
          return d[(yi * 24 + xi) * 4 + 3] > 110;
        };
        segs = 0; let prev = false;
        for (let i = 0; i <= 720; i++) {
          const a = (i % 720) / 720 * Math.PI * 2;
          const on = at(12 + 4 * Math.cos(a), 12 + 4 * Math.sin(a));
          if (on && !prev) segs++;
          prev = on;
        }
      } catch (e) { segs = -1; } finally { URL.revokeObjectURL(url); }
      return { nPaths: paths.length, nStroked, nFilled, bb, segs };
    });
    await p.close();
    // 判据
    let a = false, bb2 = false, c = false;
    if (!r.noSymbol) {
      a = r.nStroked === 0 && r.bb && r.bb.h > 0 && r.bb.w / r.bb.h > 0.95;
      bb2 = r.nFilled >= 12;
      c = r.segs >= 5;
    }
    rows.push({ label, ...r, A_纯花头: a ? 'PASS' : 'FAIL', B_瓣数: bb2 ? 'PASS' : 'FAIL', C_r4段数: c ? 'PASS' : 'FAIL' });
  }
  await b.close();
  console.log(JSON.stringify(rows, null, 1));
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
