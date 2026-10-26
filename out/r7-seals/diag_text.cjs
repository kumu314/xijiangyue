// 诊断：竖排折行后，逐行片段拼回的文本是否与原文逐字一致（顺序/标点归位）
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');

(async () => {
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r7-diag2', { channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const r = await page.evaluate(() => {
    setPaper('light'); setLayout('vertical'); setFont('size', '特大');
    const p = POEMS.find(x => x.title === '水调歌头') || POEMS.find(x => { const L = (x.lines || []).map(l => [...(l.o || '')].length); return L.some(y => y >= 16); });
    openDetail(p.id);
    const out = [];
    const lines = (p.lines || []).map(l => l.o);
    for (let li = 0; li < lines.length; li++) {
      const frags = [...document.querySelectorAll(`.vbody .vline[data-li="${li}"]`)];
      const joined = frags.map(f => f.textContent).join('');
      out.push({ li, orig: lines[li], joined, match: joined === lines[li], frags: frags.map(f => f.textContent) });
    }
    return { title: p.title, out };
  });
  console.log(r.title);
  r.out.forEach(x => {
    console.log((x.match ? 'OK  ' : 'FAIL') + ` [${x.li}] orig="${x.orig}" joined="${x.joined}" frags=${JSON.stringify(x.frags)}`);
  });
  await ctx.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
