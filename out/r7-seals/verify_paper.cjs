// #199 P2-4 验证：纸纹三档 + 持久化 + 设置面板 + 纹理面 AA 对比度像素取样
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  PASS', n, x || ''); } else { fail++; console.log('  FAIL', n, x || ''); } };

// 顶层背景层计数口径：先把每个 url(...) 整体替成 URL，再数 URL + *-gradient(
// （data-URI 内部自带 url(%23n) 与逗号，正则直接数会多计 —— 这是上一版层数 FAIL 的根因）
(async () => {
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r7', { channel: 'chrome', args: ['--no-sandbox'] });
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);

  // ⓿ 清掉上一轮跑测残留在 persistent profile 里的档位键
  // （「默认值」这个断言的成立前提就是「该键不存在」，不清就会假 FAIL）
  await page.evaluate(() => localStorage.removeItem('xjy_paper'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  // ① 默认=淡（无 localStorage 时）
  const d0 = await page.evaluate(() => ({ cls: document.body.className, paper: getPaper(), bodyHas: document.body.classList.contains('paper-light') }));
  ok('默认档=淡（body.paper-light）', d0.cls.includes('paper-light') && d0.paper === 'light', JSON.stringify(d0));

  // ② 三档切换 → body 类 + 计算样式
  const levels = {};
  for (const v of ['off', 'light', 'heavy']) {
    levels[v] = await page.evaluate((v) => {
      setPaper(v);
      const ph = getComputedStyle(document.querySelector('.phone'), '::before');
      const orig = getComputedStyle(document.querySelector('.original'));
      const lay = (bi) => {
        const stripped = bi.replace(/url\((?:[^()]|\([^()]*\))*\)/g, 'URL');
        return { layers: (stripped.match(/URL/g) || []).length + (stripped.match(/gradient\(/g) || []).length };
      };
      return {
        cls: document.body.className,
        opacity: ph.opacity,
        noise: /data:image\/svg/.test(ph.backgroundImage),
        noiseAlpha: (ph.backgroundImage.match(/opacity='([\d.]+)'/) || [])[1] || null,
        origLayers: lay(orig.backgroundImage).layers,
        origHasNoise: /data:image\/svg/.test(orig.backgroundImage),
        origHasGrad: /gradient\(/.test(orig.backgroundImage.replace(/url\((?:[^()]|\([^()]*\))*\)/g, 'URL')),
        stored: localStorage.getItem('xjy_paper'),
      };
    }, v);
  }
  ok('关档 opacity=0 且 body.paper-off', levels.off.opacity === '0' && levels.off.cls.includes('paper-off'), JSON.stringify(levels.off));
  ok('淡档 有效强度 .05（rect alpha .05 × opacity 1）', levels.light.noiseAlpha === '0.05' && levels.light.opacity === '1', JSON.stringify(levels.light));
  ok('浓档 有效强度 .08', levels.heavy.noiseAlpha === '0.08' && levels.heavy.opacity === '1', JSON.stringify(levels.heavy));
  ok('三档均持久化到 localStorage', levels.off.stored === 'off' && levels.light.stored === 'light' && levels.heavy.stored === 'heavy');
  ok('原文卡背景层数：淡/浓=2（噪声+渐变），关=1（仅渐变）',
     levels.light.origLayers === 2 && levels.heavy.origLayers === 2 && levels.off.origLayers === 1,
     `light=${levels.light.origLayers} heavy=${levels.heavy.origLayers} off=${levels.off.origLayers}`);
  ok('关档不再挂噪声图（origHasNoise=false）而仍保留渐变',
     levels.off.origHasNoise === false && levels.off.origHasGrad === true &&
     levels.light.origHasNoise === true && levels.heavy.origHasNoise === true,
     `off{noise:${levels.off.origHasNoise},grad:${levels.off.origHasGrad}} light{noise:${levels.light.origHasNoise}} heavy{noise:${levels.heavy.origHasNoise}}`);

  // ③ 刷新后保持（持久化真的能读回）
  await page.evaluate(() => setPaper('heavy'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ paper: getPaper(), cls: document.body.className }));
  ok('刷新后仍为浓档', after.paper === 'heavy' && after.cls.includes('paper-heavy'), JSON.stringify(after));

  // ④ 阅读设置面板出现「纸纹」入口（三档按钮可点）
  const panel = await page.evaluate(() => {
    openReadingSettings();
    const secs = [...document.querySelectorAll('#rsetBody .rset-sec-t')].map(x => x.textContent.trim());
    const paperBtn = [...document.querySelectorAll('#rsetBody .rset-opt')].filter(x => ['关', '淡', '浓'].includes(x.textContent.trim())).length;
    const cur = [...document.querySelectorAll('#rsetBody .rset-sec-t')].find(x => x.textContent.startsWith('纸纹'));
    closeReadingSettings();
    return { secs, paperBtn, cur: cur ? cur.textContent.trim() : null };
  });
  ok('设置面板含「纸纹」区（三档按钮）', panel.paperBtn === 3 && !!panel.cur, JSON.stringify(panel));
  ok('设置面板区序完整（排版/字号/字体/行距/纸纹/语速/音色）', panel.secs.length >= 7, panel.secs.join('|'));

  // ⑤ 对比度【真实像素取样】：浓档 → 截原文卡 → base64 回灌页面由 canvas 解码取像素
  await page.evaluate(() => setPaper('heavy'));
  const id = await page.evaluate(() => POEMS[0].id);
  await page.evaluate((id) => openDetail(id), id);
  await page.waitForTimeout(450);
  const box = await page.evaluate(() => {
    const el = document.querySelector('.original');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const x = Math.max(0, Math.round(r.x)), y = Math.max(0, Math.round(r.y));
    return {
      x, y,
      width: Math.max(1, Math.min(Math.round(r.width), vw - x)),
      height: Math.max(1, Math.min(Math.round(r.height), vh - y)),
    };
  });
  const b64 = (await page.screenshot({ clip: box })).toString('base64');
  await page.screenshot({ path: 'D:/ZCode/小程序/xijiangyue/out/r7-seals/paper-heavy-card.png', clip: box });

  const px = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    const L = (r, gg, b) => {
      const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b);
    };
    const paper = [];   // 纸底族
    const ink = [];     // 墨字族
    for (let i = 0; i < d.length; i += 4) {
      const l = L(d[i], d[i + 1], d[i + 2]);
      if (l >= 0.55) paper.push(l);
      else if (l <= 0.10) ink.push(l);
    }
    paper.sort((a, b) => a - b); ink.sort((a, b) => a - b);
    const q = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : null;
    const paperP5 = q(paper, 0.05);            // 纸底族最暗的 5% 分位 = 最不利背景
    const inkP95 = q(ink, 0.95);               // 墨字族最亮分位 = 最不利前景（抗锯齿边）
    const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return {
      total: d.length / 4, paperPx: paper.length, inkPx: ink.length,
      paperP5: paperP5 === null ? null : Math.round(paperP5 * 10000) / 10000,
      inkP95: inkP95 === null ? null : Math.round(inkP95 * 10000) / 10000,
      contrastWorst: (paperP5 !== null && inkP95 !== null) ? Math.round(cr(paperP5, inkP95) * 100) / 100 : null,
      contrastTypical: (paperP5 !== null && inkP95 !== null) ? Math.round(cr(q(paper, 0.5), q(ink, 0.5)) * 100) / 100 : null,
    };
  }, b64);

  ok('像素取样有效（纸底族与墨字族均取到足够样本）',
     px.paperPx > 500 && px.inkPx > 100, JSON.stringify({ paperPx: px.paperPx, inkPx: px.inkPx, total: px.total }));
  ok('浓档原文卡 纸底p5 vs 墨字p95 对比度 ≥ AA 4.5',
     px.contrastWorst !== null && px.contrastWorst >= 4.5,
     `worst=${px.contrastWorst} typical=${px.contrastTypical} paperP5=${px.paperP5} inkP95=${px.inkP95}`);

  ok('无 pageerror', errs.length === 0, errs.slice(0, 2).join(';'));
  await ctx.close();
  console.log(`\nP2-4-RESULT pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
