// 诊断：hero 在两档下的像素差异分布（全片 vs 个别点）
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');

(async () => {
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r7-diag', { channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const info = await page.evaluate(() => {
    showView('view-home');
    const hero = document.querySelector('.hero');
    const st = document.createElement('style');
    st.textContent = '.hero>*:not(.hero-bg){visibility:hidden !important;}';
    document.head.appendChild(st);
    hero.scrollIntoView({ block: 'center' });
    const r = hero.getBoundingClientRect();
    const z = (el) => { const c = getComputedStyle(el); return { pos: c.position, z: c.zIndex, bg: c.backgroundColor, bi: c.backgroundImage.slice(0, 60), opacity: c.opacity }; };
    const phb = getComputedStyle(document.querySelector('.phone'), '::before');
    return {
      box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
      hero: z(hero), heroChild: [...hero.children].map(z),
      phoneBefore: { pos: phb.position, z: phb.zIndex, op: phb.opacity, inset: phb.inset, bi: phb.backgroundImage.slice(0, 80) },
      stack: document.elementsFromPoint(Math.round(r.x) + 20, Math.round(r.y) + 20).map(e => e.tagName + '.' + String(e.getAttribute('class') || '').split(' ')[0]).slice(0, 8),
    };
  });
  console.log(JSON.stringify(info, null, 1));

  const shot = async (v) => {
    await page.evaluate((v) => setPaper(v), v);
    await page.waitForTimeout(600);
    return (await page.screenshot({ clip: info.box })).toString('base64');
  };
  const a = await shot('off');
  const b = await shot('light');
  const c = await shot('heavy');
  const a2 = await shot('off');

  const diff = await page.evaluate(async ({ a, b, c, a2 }) => {
    const load = async (s) => { const i = new Image(); i.src = 'data:image/png;base64,' + s; await i.decode(); const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const g = cv.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height); };
    const A = await load(a), B = await load(b), C = await load(c), A2 = await load(a2);
    const cmp = (X, Y) => {
      let n = 0, maxd = 0, minx = 1e9, miny = 1e9, maxx = -1, maxy = -1;
      for (let i = 0; i < X.data.length; i += 4) {
        const d = Math.abs(X.data[i] - Y.data[i]) + Math.abs(X.data[i + 1] - Y.data[i + 1]) + Math.abs(X.data[i + 2] - Y.data[i + 2]);
        if (d > 0) {
          n++; if (d > maxd) maxd = d;
          const p = i / 4, x = p % X.width, y = (p / X.width) | 0;
          if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
        }
      }
      return { diffPx: n, total: X.data.length / 4, maxChannelSum: maxd, bbox: n ? [minx, miny, maxx, maxy] : null };
    };
    return { offVsOff: cmp(A, A2), offVsLight: cmp(A, B), offVsHeavy: cmp(A, C) };
  }, { a, b, c, a2 });
  console.log(JSON.stringify(diff, null, 1));
  await ctx.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
