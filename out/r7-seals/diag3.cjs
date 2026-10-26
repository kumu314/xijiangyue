// 诊断 pass1：探针挂 .phone（恒可见），不调 openDetail
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  const out = await page.evaluate(() => {
    curRhymeMa = false;
    const p = POEMS.find(x => x.title === '将进酒');
    const res = {};
    for (const size of ['小', '中', '大', '特大']) {
      const f = getFont(); f.size = size; localStorage.setItem('xjy_font', JSON.stringify(f)); applyFont();
      const body = document.createElement('div');
      body.className = 'vbody';
      body.style.height = '300px';
      body.innerHTML = renderMaskLines(p.lines.map(l => l.o), p.id, 0, false);
      document.querySelector('.phone').appendChild(body);
      const rows = [...body.children].map(el => ({ len: el.textContent.length, w: Math.round(el.getBoundingClientRect().width) }));
      res[size] = { unit: Math.round(vColUnit() * 10) / 10, rows };
      body.remove();
    }
    return res;
  });
  for (const k of Object.keys(out)) console.log(k, 'unit=' + out[k].unit, JSON.stringify(out[k].rows));
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
