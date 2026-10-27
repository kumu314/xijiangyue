// 单取某个候选的「24px 像素真相」大图（canvas 强制光栅后放大 10 倍）
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const path = require('path');

const HTML = 'file:///' + path.resolve(__dirname, 'preview.html').replace(/\\/g, '/');
const T = process.argv[2] || 'F';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(HTML + '?v=' + Date.now());
  await page.waitForFunction(() => window.__PX_DONE__ > 0, { timeout: 10000 });
  // 把该候选的 canvas 放大到 10 倍
  const done = await page.evaluate((t) => {
    const cells = [...document.querySelectorAll('.px-cell')];
    const cell = cells.find(c => c.querySelector('.l').textContent.trim().startsWith(t));
    if (!cell) return false;
    const cv = cell.querySelector('canvas');
    if (!cv) return false;
    const small = document.createElement('canvas');
    small.width = small.height = 24;
    small.getContext('2d').drawImage(cv, 0, 0, 24, 24);   // 回到真 24px
    const big = document.createElement('canvas');
    big.width = big.height = 240;
    const bc = big.getContext('2d');
    bc.imageSmoothingEnabled = false;
    bc.drawImage(small, 0, 0, 240, 240);
    cv.replaceWith(big);
    return true;
  }, T);
  if (!done) { console.error('MISS ' + T); process.exit(1); }
  const cell = await page.evaluateHandle((t) => {
    const cells = [...document.querySelectorAll('.px-cell')];
    const c = cells.find(c => c.querySelector('.l').textContent.trim().startsWith(t));
    c.scrollIntoView({ block: 'center' });
    return c;
  }, T);
  await page.waitForTimeout(200);
  await cell.asElement().screenshot({ path: path.join(__dirname, `px24-${T}.png`) });
  await browser.close();
  console.log('OK px24-' + T + '.png');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
