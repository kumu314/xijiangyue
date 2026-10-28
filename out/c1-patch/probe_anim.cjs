/* 量「打卡后姿态回正」到底要多久：点击后每 40ms 采样 transform，直到单位矩阵 */
const { chromium } = require('playwright-core');
const FILE = 'file:///D:/ZCode/小程序/xijiangyue/index.html';
(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const out = [];
  for (let t = 0; t < 3; t++) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    await p.goto(FILE);
    await p.waitForTimeout(500);
    const r = await p.evaluate(async () => {
      localStorage.clear();
      showView('view-learn'); renderLearn();
      await new Promise(r => setTimeout(r, 200));
      const t0 = performance.now();
      document.querySelectorAll('.ci-item').forEach(el => toggleCheckin(el.dataset.k));
      const samples = [];
      let settleAt = null;
      for (let i = 0; i < 40; i++) {           // 最多 1600ms
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => setTimeout(r, 40));
        const els = [...document.querySelectorAll('.ci-item')];
        const tfs = els.map(el => getComputedStyle(el.querySelector('.ck svg')).transform);
        const ident = 'matrix(1, 0, 0, 1, 0, 0)';
        const allIdent = tfs.every(x => x === ident);
        if (i % 3 === 0 || !allIdent) samples.push({ ms: Math.round(performance.now() - t0), ok: allIdent, last: tfs[tfs.length - 1] });
        if (allIdent && settleAt === null) { settleAt = Math.round(performance.now() - t0); break; }
      }
      return { settleAt, samples: samples.slice(-8) };
    });
    out.push({ run: t + 1, ...r });
    await p.close();
  }
  await b.close();
  console.log(JSON.stringify(out, null, 1));
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
