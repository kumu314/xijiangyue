// 菊花 F 稿 24px 适配对比页截图
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const path = require('path');

const HTML = 'file:///' + path.resolve(__dirname, 'pick.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(HTML + '?v=' + Date.now());
  await page.waitForFunction(() => window.__PX_DONE__ > 0, { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'pick.png'), fullPage: true });
  const duel = await page.$('.duel');
  if (duel) await duel.screenshot({ path: path.join(__dirname, 'duel.png') });
  await browser.close();
  console.log('SHOT-OK');
})().catch(e => { console.error('SHOT-FAIL', e.message); process.exit(1); });
