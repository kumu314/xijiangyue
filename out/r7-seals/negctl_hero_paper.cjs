/* 反向对照：证明「maxDelta<=2 且占比<=0.1%」这条判据仍能抓到真实的纸纹漏入。
   做法：用与 tests §C2 完全相同的取样框与差值口径，
   分别量三组：
     N0 干净跨档（应等价）           —— 现状
     N1 往 .hero-bg 叠一层极淡噪声   —— 模拟「纸纹压在意象底上」，必须被判不等价
     N2 叠得更浓                     —— 必须被判不等价且 maxDelta 显著更大
   若 N1/N2 也被判「等价」，说明阈值放太松，判据失效。 */
const { chromium } = require('playwright-core');

const HTML = 'file:///D:/ZCode/%E5%B0%8F%E7%A8%8B%E5%BA%8F/xijiangyue/index.html';
const PROF = 'D:/AgentHub/tmp/chrome-r7-test';

(async () => {
  const ctx = await chromium.launchPersistentContext(PROF, {
    channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 },
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(HTML, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);

  const prep = await page.evaluate(() => {
    showView('view-home');
    const hero = document.querySelector('.hero');
    const st = document.createElement('style');
    st.id = '__hideherotext';
    st.textContent = '.hero>*:not(.hero-bg){visibility:hidden !important;}';
    document.head.appendChild(st);
    const r = hero.getBoundingClientRect();
    const INSET = 10;
    const x = Math.max(0, Math.round(r.x) + INSET), y = Math.max(0, Math.round(r.y) + INSET);
    return { box: { x, y, width: Math.max(1, Math.min(Math.round(r.width) - INSET * 2, innerWidth - x)), height: Math.max(1, Math.min(Math.round(r.height) - INSET * 2, innerHeight - y)) } };
  });

  const shot = async () => { await page.waitForTimeout(180); return (await page.screenshot({ clip: prep.box })).toString('base64'); };
  const stats = (a, b) => page.evaluate(async ({ a, b }) => {
    const load = (s) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { sizeMismatch: true };
    const w = ia.width, h = ia.height;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(ia, 0, 0); const da = cx.getImageData(0, 0, w, h).data;
    cx.clearRect(0, 0, w, h); cx.drawImage(ib, 0, 0); const db = cx.getImageData(0, 0, w, h).data;
    let over = 0, max = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (d > 0) { if (d > max) max = d; if (d > 1) over++; }
    }
    return { total: w * h, over1: over, maxDelta: max };
  }, { a, b });
  const judge = d => (!d.sizeMismatch && d.maxDelta <= 1 && d.over1 === 0) ? '等价(PASS)' : '不等价(FAIL)';

  // N0 干净跨档
  await page.evaluate(() => setPaper('off')); const a0 = await shot();
  await page.evaluate(() => setPaper('heavy')); const b0 = await shot();
  const d0 = await stats(a0, b0);
  console.log('N0 干净 off vs heavy      =', JSON.stringify(d0), '→', judge(d0));

  // N1 极淡噪声叠到 .hero-bg 上（模拟纸纹漏入）
  const addNoise = (alpha, amp) => page.evaluate(({ alpha, amp }) => {
    const hb = document.querySelector('.hero-bg') || document.querySelector('.hero');
    let cv = document.getElementById('__noise');
    if (!cv) { cv = document.createElement('canvas'); cv.id = '__noise'; cv.width = 90; cv.height = 60; }
    const cx = cv.getContext('2d');
    const im = cx.createImageData(cv.width, cv.height);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 2 * amp;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = alpha * 255;
    }
    cx.putImageData(im, 0, 0);
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    hb.appendChild(cv);
  }, { alpha, amp });

  const before1 = await shot();
  await addNoise(0.05, 60);
  const after1 = await shot();
  const d1 = await stats(before1, after1);
  console.log('N1 叠极淡噪声(α=.05,amp=60) =', JSON.stringify(d1), '→', judge(d1));

  await addNoise(0.16, 90);
  const after2 = await shot();
  const d2 = await stats(before1, after2);
  console.log('N2 叠更浓噪声(α=.16,amp=90) =', JSON.stringify(d2), '→', judge(d2));

  console.log('\n结论：', judge(d0) === '等价(PASS)' && judge(d1) === '不等价(FAIL)' && judge(d2) === '不等价(FAIL)'
    ? '✔ 判据有效（干净判等价、漏入判不等价）'
    : '✘ 判据失效，需收紧阈值');
  console.log('pageerror =', errs.slice(0, 3));
  await ctx.close();
})();
