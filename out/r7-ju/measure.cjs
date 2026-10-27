// 量「24px 光栅下各半径圆周上有几段深色」——用来找出能把 F 原稿与 F1 分开的那个半径
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const fs = require('fs');
const path = require('path');

const IDX = path.resolve(__dirname, '../../index.html');

(async () => {
  const html = fs.readFileSync(IDX, 'utf8');
  const m = html.match(/<symbol id="plant-ju" viewBox="0 0 24 24">([\s\S]*?)<\/symbol>/);
  if (!m) { console.error('找不到 plant-ju'); process.exit(1); }
  const inner = m[1];

  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const res = await page.evaluate(async (inner) => {
    const src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">'
      + '<g color="#000">' + inner + '</g></svg>';
    const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
    const img = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = url; });
    const cv = document.createElement('canvas'); cv.width = cv.height = 24;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, 24, 24);
    const d = cx.getImageData(0, 0, 24, 24).data;
    const at = (x, y) => {
      const xi = Math.round(x), yi = Math.round(y);
      if (xi < 0 || yi < 0 || xi > 23 || yi > 23) return false;
      return d[(yi * 24 + xi) * 4 + 3] > 110;
    };
    const segsAt = (r) => {
      let s = 0, prev = false;
      for (let i = 0; i <= 720; i++) {
        const a = (i % 720) / 720 * Math.PI * 2;
        const on = at(12 + r * Math.cos(a), 12 + r * Math.sin(a));
        if (on && !prev) s++;
        prev = on;
      }
      return s;
    };
    // 深色总占比（糊成团 → 占比高且内部无空隙）
    let dark = 0;
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (at(x, y)) dark++;
    const out = { dark: +(dark / 576 * 100).toFixed(1) };
    for (const r of [2, 3, 4, 5, 6, 7, 8, 9]) out['r' + r] = segsAt(r);
    URL.revokeObjectURL(url);
    return out;
  }, inner);
  await browser.close();
  console.log(JSON.stringify(res));
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
