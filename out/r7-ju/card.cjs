// 打卡卡片真观感截图：五清植物在真卡片里的样子（枯/生两态各一张）
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const path = require('path');

const HTML = 'file:///' + path.resolve(__dirname, '../../index.html').replace(/\\/g, '/');
const OUT = __dirname;

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 460, height: 900 }, deviceScaleFactor: 3 });
  await page.goto(HTML + '?v=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.evaluate(() => { showView('view-learn'); renderLearn(); });
  await page.waitForTimeout(400);

  const box = await page.$('#checkinBox');
  if (!box) { console.error('找不到 #checkinBox'); process.exit(1); }
  await box.screenshot({ path: path.join(OUT, 'card-wilt.png') });

  // 全部打勾 → 等抽芽动效跑完（plantBloom 520ms）再截，否则会抓到 scale .62 那一帧
  await page.evaluate(() => { [...document.querySelectorAll('.ci-item')].forEach(el => toggleCheckin(el.dataset.k)); });
  await page.waitForTimeout(900);
  await box.screenshot({ path: path.join(OUT, 'card-bloom.png') });

  await browser.close();
  console.log('SHOT-OK');
})().catch(e => { console.error('SHOT-FAIL', e.message); process.exit(1); });
