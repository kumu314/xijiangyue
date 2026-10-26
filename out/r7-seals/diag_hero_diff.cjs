/* 诊断：hero 三档截图「逐字节相同」断言为何不稳。
   对照设计（关键）：
     组1 = 同档连拍（heavy, heavy, heavy）  → 若彼此不同，差异来自渲染抖动，与纸纹无关
     组2 = 跨档连拍（off, light, heavy）    → 断言本身要验的对象
   同时把差异像素的包围盒打出来，看它是「散在全图」还是「集中在某条边上」。 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const HTML = 'D:/ZCode/小程序/xijiangyue/index.html';
const OUT = 'D:/ZCode/小程序/xijiangyue/out/r7-seals/';
const PROF = 'D:/AgentHub/tmp/pw-prof-diag';

(async () => {
  const ctx = await chromium.launchPersistentContext(PROF, {
    channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 },
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///' + HTML.replace(/\\/g, '/'), { waitUntil: 'load' });
  await page.evaluate(() => localStorage.removeItem('xjy_paper'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);

  // 复刻测试里的取样逻辑
  const prep = await page.evaluate(() => {
    showView('view-home');
    const hero = document.querySelector('.hero');
    if (!hero) return null;
    const st = document.createElement('style');
    st.id = '__hideherotext';
    st.textContent = '.hero>*:not(.hero-bg){visibility:hidden !important;}';
    document.head.appendChild(st);
    hero.scrollIntoView({ block: 'center' });
    const r = hero.getBoundingClientRect();
    const INSET = 10;
    const x = Math.max(0, Math.round(r.x) + INSET), y = Math.max(0, Math.round(r.y) + INSET);
    return {
      box: {
        x, y,
        width: Math.max(1, Math.min(Math.round(r.width) - INSET * 2, innerWidth - x)),
        height: Math.max(1, Math.min(Math.round(r.height) - INSET * 2, innerHeight - y)),
      },
      heroAnim: [...hero.querySelectorAll('*')].concat([hero])
        .map(el => {
          const cs = getComputedStyle(el);
          return { cls: String(el.getAttribute('class') || el.tagName), anim: cs.animationName, dur: cs.animationDuration, tr: cs.transitionProperty, trDur: cs.transitionDuration };
        })
        .filter(o => (o.anim && o.anim !== 'none') || (o.tr && o.tr !== 'none' && o.trDur !== '0s')),
    };
  });
  if (!prep) { console.log('hero 不存在'); await ctx.close(); return; }
  console.log('取样框 =', JSON.stringify(prep.box));
  console.log('hero 子树仍在动的属性 =', JSON.stringify(prep.heroAnim, null, 1));

  const grab = async (v, wait) => {
    await page.evaluate(v => setPaper(v), v);
    await page.waitForTimeout(wait);
    return page.screenshot({ clip: prep.box });
  };

  // 组1：同档连拍（对照）—— 若彼此不同，说明是渲染抖动，与纸纹无关
  const s1 = [];
  for (let i = 0; i < 3; i++) s1.push(await grab('heavy', 180));

  // 组2：跨档连拍（断言真正要验的对象）
  const cross = {};
  for (const v of ['off', 'light', 'heavy']) cross[v] = await grab(v, 180);
  const s2 = [cross.off], s3 = [cross.light];

  // 用 canvas 在页面内算差异像素数与包围盒
  const b64 = arr => arr.map(b => b.toString('base64'));
  const pair = async (a, b) => page.evaluate(async ({ a, b }) => {
    const load = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'data:image/png;base64,' + src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(ia, 0, 0); const da = cx.getImageData(0, 0, w, h).data;
    cx.clearRect(0, 0, w, h); cx.drawImage(ib, 0, 0); const db = cx.getImageData(0, 0, w, h).data;
    let n = 0, maxd = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (d > 0) { n++; if (d > maxd) maxd = d; const x = p % w, y = (p / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    return { diff: n, maxDelta: maxd, bbox: n ? { x0, y0, x1, y1 } : null };
  }, { a, b });

  const P = b64(s1), Q = b64(s2), R = b64(s3);
  console.log('\n【组1 同档连拍 heavy vs heavy】');
  console.log('  #1 vs #2 =', JSON.stringify(await pair(P[0], P[1])));
  console.log('  #2 vs #3 =', JSON.stringify(await pair(P[1], P[2])));
  console.log('\n【组2 跨档连拍】');
  console.log('  off  vs light =', JSON.stringify(await pair(Q[0], R[0])));
  console.log('  light vs heavy =', JSON.stringify(await pair(R[0], P[0])));

  fs.writeFileSync(path.join(OUT, 'diag-hero-heavy1.png'), s1[0]);
  fs.writeFileSync(path.join(OUT, 'diag-hero-heavy2.png'), s1[1]);
  fs.writeFileSync(path.join(OUT, 'diag-hero-heavy3.png'), s1[2]);
  console.log('\npageerror =', errs.slice(0, 3));
  await ctx.close();
})();
