// 诊断小档：实际字号/列宽/行长
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  const out = {};
  for (const size of ['小', '中', '大', '特大']) {
    await page.evaluate(s => { const f = getFont(); f.size = s; localStorage.setItem('xjy_font', JSON.stringify(f)); applyFont(); }, size);
    const id = await page.evaluate(() => POEMS.find(p => p.title === '将进酒').id);
    await page.evaluate(id => openDetail(id), id);
    await page.waitForTimeout(150);
    out[size] = await page.evaluate(() => {
      const vb = document.querySelector('.vbody');
      const cs = getComputedStyle(vb);
      const l0 = document.querySelector('.vbody .vline');
      const lcs = l0 ? getComputedStyle(l0) : null;
      return {
        readerFs: cs.getPropertyValue('--reader-fs').trim(),
        fs: lcs ? lcs.fontSize : null, lh: lcs ? lcs.lineHeight : null,
        vbH: vb.clientHeight,
        widths: [...document.querySelectorAll('.vbody .vline')].map(el => Math.round(el.getBoundingClientRect().width)),
        lens: [...document.querySelectorAll('.vbody .vline')].map(el => el.textContent.length),
      };
    });
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
