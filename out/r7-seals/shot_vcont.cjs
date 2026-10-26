// P1-2 视觉确认：无遮字，特大档，将进酒
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
(async () => {
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r7', { channel: 'chrome', args: ['--no-sandbox'] });
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const f = getFont(); f.size = '特大'; localStorage.setItem('xjy_font', JSON.stringify(f)); applyFont();
    setMask(0);
  });
  const id = await page.evaluate(() => POEMS.find(p => p.title === '将进酒').id);
  await page.evaluate(id => openDetail(id), id);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'D:/ZCode/小程序/xijiangyue/out/r7-seals/vcont-clean-max.png' });
  const info = await page.evaluate(() => {
    const lines = [...document.querySelectorAll('.vbody .vline')];
    return {
      frags: lines.map(el => ({ c: el.classList.contains('vcont') ? 'C' : 'F', t: el.textContent })),
      unit: Math.round(vColUnit()),
    };
  });
  console.log(JSON.stringify(info));
  await ctx.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
