// 捕获 renderVbody 埋点：将进酒 × 4 字号
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
(async () => {
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r7', { channel: 'chrome', args: ['--no-sandbox'] });
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  page.on('console', m => { const t = m.text(); if (t.startsWith('R7DBG')) console.log(t); });
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => { window.__R7DBG = true; });
  for (const size of ['小', '中', '大', '特大']) {
    console.log('=== ' + size + ' ===');
    await page.evaluate(s => { const f = getFont(); f.size = s; localStorage.setItem('xjy_font', JSON.stringify(f)); applyFont(); }, size);
    const id = await page.evaluate(() => POEMS.find(p => p.title === '将进酒').id);
    await page.evaluate(id => openDetail(id), id);
    await page.waitForTimeout(200);
  }
  await ctx.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
