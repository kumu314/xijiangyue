// 诊断：特大档下每个 .vline 的宽度/文本长/class
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => { const f = getFont(); f.size = '特大'; localStorage.setItem('xjy_font', JSON.stringify(f)); applyFont(); });
  const id = await page.evaluate(() => POEMS.find(p => p.title === '将进酒').id);
  await page.evaluate(id => openDetail(id), id);
  await page.waitForTimeout(200);
  const dump = await page.evaluate(() => {
    const vb = document.querySelector('.vbody');
    const cs = getComputedStyle(vb);
    return {
      vbody: { w: vb.clientWidth, h: vb.clientHeight, padT: cs.paddingTop, padL: cs.paddingLeft, wm: cs.writingMode },
      lines: [...document.querySelectorAll('.vbody .vline')].map(el => {
        const r = el.getBoundingClientRect();
        return { cls: el.className, len: el.textContent.length, w: Math.round(r.width), sh: el.scrollHeight, ch: el.clientHeight, txt: el.textContent.slice(0, 12) };
      }),
    };
  });
  console.log(JSON.stringify(dump, null, 1));
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
