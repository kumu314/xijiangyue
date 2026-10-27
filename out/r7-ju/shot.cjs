// 菊花候选小样截图（png 不入库，仅对话内查看）
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const path = require('path');

const HTML = 'file:///' + path.resolve(__dirname, 'preview.html').replace(/\\/g, '/');
const OUT = path.join(__dirname, 'preview.png');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--force-device-scale-factor=2'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(HTML + '?v=' + Date.now());
  await page.waitForFunction(() => window.__PX_DONE__ > 0, { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT, fullPage: true });
  const grid = await page.$('.px-grid');
  if (grid) await grid.screenshot({ path: path.join(__dirname, 'pixel.png') });
  await browser.close();
  console.log('SHOT-OK ' + OUT);
})().catch(e => { console.error('SHOT-FAIL', e.message); process.exit(1); });
