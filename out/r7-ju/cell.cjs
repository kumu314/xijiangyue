// 按「行标题 + 尺寸标签」精确截取某个候选的单元格，用于跟枯木贴的图逐一比对
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const path = require('path');

const HTML = 'file:///' + path.resolve(__dirname, 'preview.html').replace(/\\/g, '/');
const TARGETS = (process.argv[2] || 'D,E,F').split(',');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 4 });
  await page.goto(HTML + '?v=' + Date.now());
  await page.waitForFunction(() => window.__PX_DONE__ > 0, { timeout: 10000 });
  await page.waitForTimeout(300);

  const map = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.row').forEach(row => {
      const h = row.querySelector('.h').textContent.trim();
      row.querySelectorAll('.cell').forEach(c => {
        out.push({ h, l: c.querySelector('.l').textContent.trim() });
      });
    });
    return out;
  });

  for (const t of TARGETS) {
    const idx = map.findIndex(m => m.h.startsWith(t) && m.l === '96px 生');
    if (idx < 0) { console.log('MISS ' + t); continue; }
    const cells = await page.$$('.cell');
    const s = await cells[idx].$('.s');
    const out = path.join(__dirname, `cell-${t}-96.png`);
    await s.screenshot({ path: out });
    console.log('OK ' + t + ' -> ' + out + '  (' + map[idx].h + ' | ' + map[idx].l + ')');
  }
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
