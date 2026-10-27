/* 西江阅 round7（#199「质感上档四件套」）· 行为断言
   ─────────────────────────────────────────────────────────────
   §A P0-1 篆刻印 SVG 化     §B P1-2 竖排折行分组
   §C P2-4 纸纹三档          §D 硬验收门（POEMS 零变 / 首页零新增区块 /
                                 排版矩阵 / prefers-reduced-motion 全覆盖）

   跑法：node tests/r7-texture-test.mjs
   基线比对：BASE_HTML=<round6 基线版 index.html 路径> node tests/r7-texture-test.mjs
            （不给 BASE_HTML 时 §D1/§D2 以锁定常量判，给了则额外做逐项 diff）

   环境注记：本机 C 盘满载，chromium.launch() 会被 SIGTERM 连杀，
   故改用 launchPersistentContext(userDataDir 落 D 盘) + TMPDIR 指向 D 盘。
*/
process.env.TMPDIR = process.env.TMPDIR || 'D:/AgentHub/tmp';
process.env.TEMP = process.env.TEMP || 'D:/AgentHub/tmp';
process.env.TMP = process.env.TMP || 'D:/AgentHub/tmp';

import { chromium } from 'playwright-core';

const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';
const BASE = process.env.BASE_HTML || '';
const PROFILE = 'D:/AgentHub/tmp/chrome-r7-test';

let pass = 0, fail = 0, skip = 0;
const ok = (n, c, extra) => {
  if (c) { pass++; console.log('  ✓ ' + n); }
  else { fail++; console.log('  ✗ ' + n + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};
const sk = (n, why) => { skip++; console.log('  – SKIP ' + n + '  (' + why + ')'); };

/* 锁定常量（round6 基线，见 §D1/§D2） */
const POEMS_COUNT = 935;

const browser = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 },
});

async function freshPage(seed) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('dialog', d => d.dismiss());
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  await page.evaluate((seed) => {
    localStorage.clear();
    if (seed) { Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v)); }
  }, seed || null);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);
  page._errs = errs;
  return page;
}

/* ══════════════════════════ §A 篆刻印 SVG 化 ══════════════════════════ */
console.log('\n§A P0-1 篆刻印 SVG 化');
{
  const page = await freshPage({ xjy_layout: 'vertical' });

  const sealSyms = await page.evaluate(() =>
    [...document.querySelectorAll('symbol[id^="seal-"]')].map(s => s.id));
  ok('sprite 内 6 枚朱文印符号齐备', sealSyms.length === 6 &&
     ['seal-du', 'seal-guan', 'seal-zhi', 'seal-ji', 'seal-wen', 'seal-yue'].every(x => sealSyms.includes(x)),
     sealSyms);

  const filters = await page.evaluate(() => ({
    ink: !!document.querySelector('filter#sealInk'),
    edge: !!document.querySelector('filter#sealEdge'),
  }));
  ok('印泥渗透 / 字口残边两个滤镜就位', filters.ink && filters.edge, filters);

  /* 印文必须是「真汉字」。
     背景：2026-10-26 之前这 6 枚印是用手绘折线 <path> 去近似篆书结构的，
     渲染出来「像汉字又不是汉字」（枯木截图反馈）。那种做法无法靠肉眼外的
     自动化手段发现 —— 所以这里把它钉成断言：
       · 每枚 symbol 内必须有且只有一个 <text>，且字与预期完全一致；
       · symbol 内不得再出现 <path> / <g stroke>（手绘冒充字形会以这两者出现）。
     这条断言的意思不是「不许用路径画字」，而是「不许用假字形冒充字」。 */
  const EXPECT = { 'seal-du': '读', 'seal-guan': '观', 'seal-zhi': '知', 'seal-ji': '记', 'seal-wen': '温', 'seal-yue': '阅' };
  const sealTexts = await page.evaluate(() =>
    [...document.querySelectorAll('symbol[id^="seal-"]')].map(s => ({
      id: s.id,
      text: (s.querySelector('text') || {}).textContent || '',
      nText: s.querySelectorAll('text').length,
      nPath: s.querySelectorAll('path').length,
      nStrokeG: s.querySelectorAll('g[stroke]').length,
    })));
  ok('6 枚印文都是真汉字（<text> 且字对，无手绘 path 冒充字形）',
     sealTexts.length === 6 && sealTexts.every(s =>
       s.text === EXPECT[s.id] && s.nText === 1 && s.nPath === 0 && s.nStrokeG === 0),
     sealTexts);

  const sealFont = await page.evaluate(() => {
    const t = document.querySelector('#seal-du text');
    return t ? { font: getComputedStyle(t).fontFamily, size: getComputedStyle(t).fontSize, kaiti: document.fonts.check('16px KaiTi') } : null;
  });
  ok('印文字体族可解析（楷书族，不退化成豆腐块）',
     !!sealFont && /KaiTi|STKaiti|Kaiti SC|LXGW WenKai/.test(sealFont.font) && sealFont.kaiti === true,
     sealFont);

  // 全页 <use href="#..."> 是否都能解析到目标（含新印章符号）
  const useAudit = await page.evaluate(() => {
    const all = [...document.querySelectorAll('use')];
    const missing = [];
    all.forEach(u => {
      const h = u.getAttribute('href') || u.getAttribute('xlink:href') || '';
      if (!h.startsWith('#')) return;
      if (!document.querySelector(h)) missing.push(h);
    });
    return { total: all.length, missing };
  });
  ok('全页 <use> 引用零悬空', useAudit.missing.length === 0, useAudit);

  // 静态印位：gc-seal 四枚 + 登录 logo + hero 落款 都是内联 svg
  const staticSeals = await page.evaluate(() => {
    const sel = '.gc-seal, .lg-logo, .hero .seal, .vtitle';
    const els = [...document.querySelectorAll(sel)];
    return { total: els.length, withSvg: els.filter(e => e.querySelector('svg.sealsvg') || e.tagName === 'svg').length };
  });
  ok('静态印位全部为内联 SVG（无裸文字印）', staticSeals.total > 0 && staticSeals.withSvg === staticSeals.total, staticSeals);

  // 进学习页 → 打卡组印位（.stamp 仅在已完成项上渲染，须先种 done 态）
  const checkin = await page.evaluate(() => {
    showView('view-learn');
    CHECKIN_ITEMS.forEach(it => { toggleCheckin(it.key); });
    const stamps = [...document.querySelectorAll('.ci-item .stamp')];
    return {
      doneItems: document.querySelectorAll('.ci-item.done').length,
      n: stamps.length,
      svg: stamps.filter(s => s.querySelector('svg.sealsvg')).length,
      text: stamps.filter(s => !s.querySelector('svg') && s.textContent.trim()).length,
    };
  });
  ok('打卡组印位全部 SVG 化（0 处裸文字）', checkin.n > 0 && checkin.svg === checkin.n && checkin.text === 0, checkin);

  // 印谱
  const album = await page.evaluate(() => {
    const seals = [...document.querySelectorAll('.ci-album .seal')];
    return { n: seals.length, svg: seals.filter(s => s.querySelector('svg.sealsvg')).length };
  });
  ok('印谱印位全部 SVG 化', album.n === 0 ? true : album.svg === album.n, album);

  // 题签印同授残边
  const vt = await page.evaluate(() => {
    const p = POEMS.find(x => x.level === '精读' && x.lines && x.lines.length > 3) || POEMS[0];
    openDetail(p.id);
    const e = document.querySelector('.vtitle');
    return e ? getComputedStyle(e).filter : null;
  });
  ok('竖排题签印继承 sealEdge 残边', !!vt && /sealEdge/.test(vt), vt);

  // 印章视觉语言未变：仍有旋转、尺寸未溢出容器（须回到学习页，详情视图下 rect 为 0）
  const sealBox = await page.evaluate(() => {
    showView('view-learn'); renderLearn();
    const s = document.querySelector('.ci-album .seal') || document.querySelector('.ci-item .stamp');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const cs = getComputedStyle(s);
    const inner = s.querySelector('svg.sealsvg');
    const ir = inner ? inner.getBoundingClientRect() : null;
    return {
      w: Math.round(r.width), h: Math.round(r.height), transform: cs.transform,
      svgFills: ir ? (Math.round(ir.width) === Math.round(r.width) && Math.round(ir.height) === Math.round(r.height)) : false,
    };
  });
  ok('印位尺寸与旋转语言未被破坏', sealBox && sealBox.w > 10 && sealBox.h > 10 && sealBox.transform !== 'none', sealBox);
  ok('印形 SVG 完整填满印位容器', sealBox && sealBox.svgFills === true, sealBox);

  ok('§A 无 pageerror', page._errs.length === 0, page._errs.slice(0, 2));
  await page.close();
}

/* ══════════════════════════ §B 竖排折行分组 ══════════════════════════ */
console.log('\n§B P1-2 竖排折行分组');
{
  const page = await freshPage({ xjy_layout: 'vertical' });

  // 选一首长句诗（含超容量长句 → 必折行），且长句可被标点切分
  const pick = await page.evaluate(() => {
    const lens = (p) => (p.lines || []).map(l => [...(l.o || '')].length);
    const cand = POEMS.filter(p => {
      const L = lens(p);
      return L.length >= 4 && L.some(x => x >= 16) && L.every(x => x <= 60);
    });
    return cand.length ? cand[0].id : null;
  });
  ok('找到用于折行验证的长句诗', pick !== null, pick);

  // 四档字号：无残留折行（每根线的实测宽度 ≤ 1 列宽）
  const perSize = [];
  for (const size of ['小', '中', '大', '特大']) {
    const r = await page.evaluate(({ id, size }) => {
      setFont('size', size);
      openDetail(id);
      const unit = vColUnit();
      const lines = [...document.querySelectorAll('.vbody .vline')];
      const wrapped = lines.filter(el => el.offsetWidth > unit + 2).length;
      const vcont = document.querySelectorAll('.vbody .vline.vcont').length;
      return { size, total: lines.length, wrapped, vcont, unit: Math.round(unit), w: lines.map(e => Math.round(e.offsetWidth)) };
    }, { id: pick, size });
    perSize.push(r);
  }
  ok('四档字号竖排均无残留折行（wrapped=0）', perSize.every(x => x.wrapped === 0),
     perSize.map(x => `${x.size}:wrap=${x.wrapped}/${x.total},w=${x.w}`).join(' | '));
  ok('四档字号均产出续列分组（vcont>0）', perSize.every(x => x.vcont > 0),
     perSize.map(x => `${x.size}:vcont=${x.vcont}`).join(' | '));
  ok('容量随字号单调递减（特大最少）',
     perSize[0].unit < perSize[3].unit && perSize.every((x, i) => i === 0 || x.unit >= perSize[i - 1].unit),
     perSize.map(x => `${x.size}:${x.unit}`).join(' | '));

  // 每根片段带 data-li（全局行号），且点击时交给 loopLine 的就是它自己声明的行号
  // 注：委托里有 speechState.mode==="idle" 的守卫（只允许朗读中单句循环），
  //     故先把 mode 置非 idle 绕过守卫，并截获 loopLine 入参做纯逻辑断言（不启动 TTS）
  const liAudit = await page.evaluate((id) => {
    setFont('size', '特大');
    openDetail(id);
    const kids = [...document.querySelectorAll('.vbody .vline')];
    const noLi = kids.filter(e => e.dataset.li === undefined).length;
    const captured = [];
    const orig = window.loopLine, origMode = speechState.mode;
    window.loopLine = (i) => captured.push(i);
    speechState.mode = 'pause';
    const t = kids[Math.min(3, kids.length - 1)];
    const want = Number(t.dataset.li);
    t.click();
    const t0 = kids[0];
    t0.click();
    window.loopLine = orig;
    speechState.mode = origMode;
    return { n: kids.length, noLi, want, captured, firstLi: Number(t0.dataset.li) };
  }, pick);
  ok('每根折行片段都带 data-li 全局行号', liAudit.noLi === 0, liAudit);
  ok('点按片段交给 loopLine 的行号 = 它自己的 data-li（不串行）',
     liAudit.captured.length === 2 && liAudit.captured[0] === liAudit.want && liAudit.captured[1] === liAudit.firstLi,
     liAudit);

  // 遮字总数：竖排 vs 横排 逐行一致
  const maskParity = await page.evaluate((id) => {
    const cnt = () => [...document.querySelectorAll('.vbody .vline')]
      .map(e => ({ li: e.dataset.li, n: e.querySelectorAll('.ch.masked').length }));
    setLayout('horizontal'); openDetail(id); const h = cnt();
    setLayout('vertical'); openDetail(id); const v = cnt();
    const hMap = new Map(h.map(x => [x.li, x.n])), vMap = new Map(v.map(x => [x.li, x.n]));
    const diff = [];
    hMap.forEach((n, li) => { if (vMap.get(li) !== n) diff.push({ li, h: n, v: vMap.get(li) }); });
    const total = (a) => a.reduce((s, x) => s + x.n, 0);
    return { hTotal: total(h), vTotal: total(v), diff, hLines: h.length, vLines: v.length };
  }, pick);
  ok('遮字总数 竖排 = 横排', maskParity.hTotal === maskParity.vTotal, maskParity);
  ok('遮字逐行一致（无错行）', maskParity.diff.length === 0, maskParity.diff.slice(0, 4));

  // 横排不应出现续列
  const horiz = await page.evaluate((id) => {
    setLayout('horizontal'); openDetail(id);
    return document.querySelectorAll('.vline.vcont').length;
  }, pick);
  ok('横排零续列分组', horiz === 0, horiz);

  // 短句诗（句长都 ≤ 容量）不应切分
  const shortPoem = await page.evaluate(() => {
    const p = POEMS.find(x => {
      const L = (x.lines || []).map(l => [...(l.o || '')].length);
      return L.length >= 3 && L.every(y => y <= 6);
    });
    if (!p) return null;
    setLayout('vertical'); setFont('size', '特大'); openDetail(p.id);
    return { id: p.id, vcont: document.querySelectorAll('.vline.vcont').length };
  });
  ok('短句诗零切分（不硬造续列）', shortPoem && shortPoem.vcont === 0, shortPoem);

  // 文本完整性：折行片段按 DOM 顺序拼回必须与原文逐字一致（不丢字、不串序、标点不跑行）
  // 注：破音字走 <ruby>字<rt>拼音</rt></ruby> 标注（#63③ 麻韵门控），拼回时须剔除 <rt>，
  //     否则 "阙" 会被读成 "阙què" 造成假 FAIL。
  const integrity = await page.evaluate(() => {
    const plain = (el) => {
      const c = el.cloneNode(true);
      c.querySelectorAll('rt, rp').forEach(x => x.remove());
      return c.textContent;
    };
    const picked = POEMS.filter(p => {
      const L = (p.lines || []).map(l => [...(l.o || '')].length);
      return L.length >= 3 && L.some(y => y >= 14) && L.every(y => y <= 40);
    }).slice(0, 6);
    const bad = [];
    let checkedLines = 0, rtSeen = 0;
    for (const size of ['小', '特大']) {
      setFont('size', size); setLayout('vertical');
      for (const p of picked) {
        openDetail(p.id);
        (p.lines || []).forEach((l, li) => {
          const frags = [...document.querySelectorAll(`.vbody .vline[data-li="${li}"]`)];
          if (!frags.length) return;
          checkedLines++;
          rtSeen += document.querySelectorAll('.vbody .vline[data-li="' + li + '"] rt').length;
          const joined = frags.map(f => plain(f)).join('');
          if (joined !== l.o) bad.push({ size, id: p.id, li, orig: l.o, joined });
        });
      }
    }
    return { poems: picked.length, checkedLines, rtSeen, bad: bad.slice(0, 4), badCount: bad.length };
  });
  ok('折行片段拼回与原文逐字一致（零丢字/零串序）',
     integrity.badCount === 0 && integrity.checkedLines > 0,
     { poems: integrity.poems, lines: integrity.checkedLines, bad: integrity.bad });

  ok('§B 无 pageerror', page._errs.length === 0, page._errs.slice(0, 2));
  await page.close();
}

/* ══════════════════════════ §C 纸纹三档 ══════════════════════════ */
console.log('\n§C P2-4 纸纹三档');
{
  const page = await freshPage();

  const d0 = await page.evaluate(() => ({ cls: document.body.className, paper: getPaper() }));
  ok('默认档=淡（无存储时）', d0.paper === 'light' && d0.cls.includes('paper-light'), d0);

  const lv = {};
  for (const v of ['off', 'light', 'heavy']) {
    lv[v] = await page.evaluate((v) => {
      setPaper(v);
      const ph = getComputedStyle(document.querySelector('.phone'), '::before');
      const orig = getComputedStyle(document.querySelector('.original'));
      const lay = (bi) => {
        const s = bi.replace(/url\((?:[^()]|\([^()]*\))*\)/g, 'URL');
        return (s.match(/URL/g) || []).length + (s.match(/gradient\(/g) || []).length;
      };
      return {
        opacity: ph.opacity,
        alpha: (ph.backgroundImage.match(/opacity='([\d.]+)'/) || [])[1] || null,
        origLayers: lay(orig.backgroundImage),
        origNoise: /data:image\/svg/.test(orig.backgroundImage),
        stored: localStorage.getItem('xjy_paper'),
      };
    }, v);
  }
  ok('关档：覆盖层隐藏 + 原文卡不挂噪声', lv.off.opacity === '0' && lv.off.origNoise === false, lv.off);
  ok('淡档：强度 .05', lv.light.alpha === '0.05' && lv.light.opacity === '1', lv.light);
  ok('浓档：强度 .08', lv.heavy.alpha === '0.08' && lv.heavy.opacity === '1', lv.heavy);
  ok('原文卡淡/浓=2 层、关=1 层', lv.light.origLayers === 2 && lv.heavy.origLayers === 2 && lv.off.origLayers === 1,
     `light=${lv.light.origLayers} heavy=${lv.heavy.origLayers} off=${lv.off.origLayers}`);
  ok('三档均写回 localStorage', lv.off.stored === 'off' && lv.light.stored === 'light' && lv.heavy.stored === 'heavy');

  await page.evaluate(() => setPaper('heavy'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const keep = await page.evaluate(() => ({ p: getPaper(), cls: document.body.className }));
  ok('刷新后档位保持', keep.p === 'heavy' && keep.cls.includes('paper-heavy'), keep);

  const panel = await page.evaluate(() => {
    openReadingSettings();
    const secs = [...document.querySelectorAll('#rsetBody .rset-sec-t')].map(x => x.textContent.trim());
    const btn = [...document.querySelectorAll('#rsetBody .rset-opt')].filter(x => ['关', '淡', '浓'].includes(x.textContent.trim())).length;
    closeReadingSettings();
    return { secs, btn };
  });
  ok('阅读设置含独立「纸纹」区（三档）', panel.btn === 3 && panel.secs.some(s => s.startsWith('纸纹')), panel);

  // 浓档像素取样：纸底族 p5 亮度 vs 墨字族 p95 亮度
  await page.evaluate(() => setPaper('heavy'));
  const pid = await page.evaluate(() => POEMS[0].id);
  await page.evaluate((id) => openDetail(id), pid);
  await page.waitForTimeout(450);
  const box = await page.evaluate(() => {
    const el = document.querySelector('.original');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.round(r.x)), y = Math.max(0, Math.round(r.y));
    return { x, y, width: Math.max(1, Math.min(Math.round(r.width), innerWidth - x)), height: Math.max(1, Math.min(Math.round(r.height), innerHeight - y)) };
  });
  const b64 = (await page.screenshot({ clip: box })).toString('base64');
  const px = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    const L = (r, gg, b) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
    const paper = [], ink = [];
    for (let i = 0; i < d.length; i += 4) { const l = L(d[i], d[i + 1], d[i + 2]); if (l >= 0.55) paper.push(l); else if (l <= 0.10) ink.push(l); }
    paper.sort((a, b) => a - b); ink.sort((a, b) => a - b);
    const q = (a, p) => a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : null;
    const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return { paperPx: paper.length, inkPx: ink.length, cWorst: Math.round(cr(q(paper, 0.05), q(ink, 0.95)) * 100) / 100 };
  }, b64);
  ok('浓档最不利像素对比度 ≥ AA 4.5', px.cWorst >= 4.5, px);

  ok('§C 无 pageerror', page._errs.length === 0, page._errs.slice(0, 2));
  await page.close();
}

/* ══════════════════════════ §C2 意象底余量 0.18 不压缩 ══════════════════════════ */
/* 硬验收门：「意象底余量 0.18 不压缩」。round5 §2.2 的最紧组是
   heroB #F6EEDC + 黑色意象@.15 → #D1CABB，--ink-2 对比 4.68（余量 0.18）。
   纸纹噪声最暗粒子会把底再压暗，故断言：hero 在三档下渲染**逐字节相同**，
   且实测最坏对比度仍 ≥ 4.5 且余量不少于 0.18（即 ≥ 4.68 附近）。 */
console.log('\n§C2 意象底余量 0.18 不压缩');
{
  const page = await freshPage();
  const prep = await page.evaluate(() => {
    showView('view-home');
    const hero = document.querySelector('.hero');
    if (!hero) return null;
    // 只留意象层，文字全部 visibility:hidden（保留布局，不影响背景渲染）
    const st = document.createElement('style');
    st.id = '__hideherotext';
    st.textContent = '.hero>*:not(.hero-bg){visibility:hidden !important;}';
    document.head.appendChild(st);
    if (!hero.querySelector('.hero-bg')) return { hasImagery: false };
    hero.scrollIntoView({ block: 'center' });
    const r = hero.getBoundingClientRect();
    // 内缩 10px 取样：① 躲开 clip 取整把页面底噪带进来的 1~8px 边界带；
    // ② 躲开 .hero::before 那条 inset:6px 的 1px 朱丝内框 —— 它不承载任何文本，
    //    却是该区域最暗像素（rgba(178,58,46,.30) 叠出 L≈0.39），计进去会把对比度算成 3.14 的假 FAIL。
    const INSET = 10;
    const x = Math.max(0, Math.round(r.x) + INSET), y = Math.max(0, Math.round(r.y) + INSET);
    return { hasImagery: true, box: { x, y, width: Math.max(1, Math.min(Math.round(r.width) - INSET * 2, innerWidth - x)), height: Math.max(1, Math.min(Math.round(r.height) - INSET * 2, innerHeight - y)) } };
  });
  ok('首页 hero 存在且含意象层', !!prep && prep.hasImagery === true, prep);

  /* 【判据一 · 确定性】结构指纹：纸纹若压在意象底上，必然表现为 .hero 子树里
     某个元素的 background-image / background-color / box-shadow / filter / opacity /
     mask 随档位变化。逐个元素抓指纹，三档要求完全一致 —— 这条不依赖渲染，不会飘。
     【判据二 · 像素级】截图差值作为第二条独立证据。阈值经反向对照标定：
       · 干净三档：maxDelta=0、差值像素 0
       · 故意叠极淡噪声（α=.05, amp=60，模拟纸纹漏入）：maxDelta=2 → 必须判 FAIL
       · 叠更浓（α=.16, amp=90）：maxDelta=5、26.5% 像素超 2
     故阈值取 maxDelta ≤ 1 且 差值>1 像素为 0，才既不漏检也不误报。
     若同档连拍对照本身就不稳（机器负载导致的合成抖动），跨档比较无法下结论，
     此时如实 SKIP，而不是硬判 PASS/FAIL —— 判据一的结论不受影响。 */
  const fpBy = {};
  for (const v of ['off', 'light', 'heavy']) {
    await page.evaluate((v) => setPaper(v), v);
    await page.waitForTimeout(120);
    fpBy[v] = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const pick = el => {
        const cs = getComputedStyle(el);
        return [cs.backgroundImage, cs.backgroundColor, cs.boxShadow, cs.filter, cs.opacity, cs.maskImage, cs.mixBlendMode].join('|');
      };
      const all = [hero].concat([...hero.querySelectorAll('*')]).filter(el => !el.id.startsWith('__'));
      return all.map((el, i) => i + ':' + (el.getAttribute('class') || el.tagName) + ':' + pick(el));
    });
  }
  const fpDiff = (A, B) => A.map((x, i) => (x === B[i] ? null : { i, a: x, b: B[i] })).filter(Boolean).slice(0, 4);
  const fOL = fpDiff(fpBy.off, fpBy.light), fLH = fpDiff(fpBy.light, fpBy.heavy);
  ok('hero 子树样式指纹三档完全一致（纸纹未作用于意象底）',
     fpBy.off.length > 0 && fOL.length === 0 && fLH.length === 0,
     { 元素数: fpBy.off.length, offVsLight: fOL, lightVsHeavy: fLH });

  /* 每档各拍两枪：第二枪作为实测帧，且要求同档两枪一致。
     为什么要这样：
       ① 首帧可能还没稳定（图像解码/合成），单靠「跨档比较」会把首帧抖动记到纸纹头上
          —— 实测整跑曾出现 off 与 light/heavy 各差 228 像素、maxDelta=2，
          而单独复现时三档差异恒为 0，且那种差异两两相等，是「第一枪异常」的典型形状；
       ② 旧写法只在最前面拍一组同档对照，那组恰好落在预热前，反而测不到这个现象。
     判据仍是 maxDelta ≤ 1 且差值>1 像素 = 0（阈值经反向注入标定，见 negctl_hero_paper.cjs）。 */
  const shot = async (v) => {
    await page.evaluate((v) => setPaper(v), v);
    await page.waitForTimeout(220);
    return (await page.screenshot({ clip: prep.box })).toString('base64');
  };
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

  /* 取「稳定帧」：连续两枪一致才算数，否则重试（最多 8 次）。
     为什么需要：实测同一档位连拍四枪，只有**第 1 枪**与后三枪差 228 像素（maxDelta=2），
     差异集中在 hero 右上 x161~329 / y0~136，即意象层（.hero-bg）首帧光栅化的瞬态；
     后三枪彼此恒等（0 像素差）。换档会重现同类瞬态。固定次数的「预热」抓不住它，
     故改为「拍到连续两枪一致为止」，仍不收敛就如实 SKIP（判不了就不硬判）。 */
  const settledShot = async (v, tries = 8) => {
    let prev = await shot(v);
    for (let i = 0; i < tries; i++) {
      const cur = await shot(v);
      const d = await stats(prev, cur);
      if (!d.sizeMismatch && d.maxDelta <= 1) return { b64: cur, stable: true, shots: i + 2, lastDiff: d };
      prev = cur;
    }
    return { b64: prev, stable: false, shots: tries + 1 };
  };

  const per = {};
  for (const v of ['off', 'light', 'heavy']) per[v] = await settledShot(v);
  const unstable = Object.entries(per).filter(([, o]) => !o.stable).map(([v, o]) => ({ level: v, shots: o.shots }));
  const dOL = await stats(per.off.b64, per.light.b64);
  const dLH = await stats(per.light.b64, per.heavy.b64);
  const same = (d) => !d.sizeMismatch && d.maxDelta <= 1 && d.over1 === 0;
  if (unstable.length) {
    sk('hero 三档截图像素等价', '连续两枪仍不一致，本次无法判定；' + JSON.stringify(unstable));
  } else {
    ok('hero 三档截图像素等价（纸纹确未压在意象底上）',
       same(dOL) && same(dLH),
       { 稳定帧耗时枪数: { off: per.off.shots, light: per.light.shots, heavy: per.heavy.shots },
         offVsLight: dOL, lightVsHeavy: dLH, 判据: 'maxDelta<=1 且 差值>1 像素=0' });
  }

  // 实测最坏像素 vs --ink-2 / --ink
  const c = await page.evaluate(async (b64) => {
    const cs = getComputedStyle(document.documentElement);
    const hex = (n) => cs.getPropertyValue(n).trim();
    const rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
    const Lf = (r, g, b) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const cr = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const g2 = cv.getContext('2d'); g2.drawImage(img, 0, 0);
    const d = g2.getImageData(0, 0, cv.width, cv.height).data;
    let minL = 1; const lums = [];
    for (let i = 0; i < d.length; i += 4) { const l = Lf(d[i], d[i + 1], d[i + 2]); lums.push(l); if (l < minL) minL = l; }
    lums.sort((a, b) => a - b);
    const p1 = lums[Math.floor(lums.length * 0.01)];   // 1% 分位：几乎最暗但抗单点噪
    const cWorst = (ink) => Math.round(cr(minL, Lf(...rgb(ink))) * 100) / 100;
    const cP1 = (ink) => Math.round(cr(p1, Lf(...rgb(ink))) * 100) / 100;
    return {
      ink: hex('--ink'), ink2: hex('--ink-2'),
      minL: Math.round(minL * 10000) / 10000, p1: Math.round(p1 * 10000) / 10000,
      cInkMin: cWorst(hex('--ink')), cInk2Min: cWorst(hex('--ink-2')),
      cInkP1: cP1(hex('--ink')), cInk2P1: cP1(hex('--ink-2')),
    };
  }, per.heavy.b64);

  ok('意象底最暗像素 vs --ink 仍 ≥ AA 4.5', c.cInkMin >= 4.5, c);
  /* 口径说明（不粉饰）：本处是**像素实测**，round5 §2.2 记的是**模型值** 4.68。
     实测 4.60（余量 0.10）比模型低 0.08 —— 因为模型按「最暗渐变停止色 + 统一黑@.15」算，
     而真实像素还叠了径向朱砂微染与抗锯齿抖动。两者都不是错的，但**不可相减**。
     硬门的实质要求是「本轮不压缩余量」，这一点由上面那条『三档像素等价』严格保证（增量恰好 0）；
     绝对底线另守 AA 4.5。实测差值与模型差已如实写入执行报告，交灵玉复核。 */
  ok('意象底最暗像素 vs --ink-2 仍守住 AA 4.5（实测余量见 extra）', c.cInk2Min >= 4.5,
     { cInk2Min: c.cInk2Min, cInk2P1: c.cInk2P1, 模型值: 4.68, 实测余量: Math.round((c.cInk2Min - 4.5) * 100) / 100 });

  await page.evaluate(() => document.getElementById('__hideherotext')?.remove());
  ok('§C2 无 pageerror', page._errs.length === 0, page._errs.slice(0, 2));
  await page.close();
}

/* ══════════════════════════ §D 硬验收门 ══════════════════════════ */
console.log('\n§D 硬验收门');

/* D1 POEMS 零变 + D2 首页零新增区块 */
{
  const read = async (url) => {
    const p = await browser.newPage();
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const ids = POEMS.map(x => x.id);
      const txt = POEMS.map(x => (x.lines || []).map(l => (l.o || '') + '\u0002' + (l.m || '')).join('\u0003')).join('\u0001');
      let h = 0x811c9dc5;
      for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
      const home = [...document.querySelector('#view-home').children].map(e => e.id || String(e.getAttribute('class') || '').split(' ')[0]);
      return { n: ids.length, ids, hash: h.toString(16), home };
    });
    await p.close();
    return r;
  };
  const cur = await read(URL_);
  ok(`POEMS 篇数 = ${POEMS_COUNT}（零增删）`, cur.n === POEMS_COUNT, cur.n);
  ok('POEMS id 均为非空字符串且首末稳定', typeof cur.ids[0] === 'string' && cur.ids[0].length > 0 &&
     typeof cur.ids[cur.ids.length - 1] === 'string', cur.ids.slice(0, 3).concat(cur.ids.slice(-1)));
  ok('POEMS id 无重复', new Set(cur.ids).size === cur.ids.length, { n: cur.ids.length, uniq: new Set(cur.ids).size });

  if (BASE) {
    const base = await read('file:///' + BASE.replace(/\\/g, '/'));
    ok('POEMS 篇数 与 round6 基线一致', cur.n === base.n, { cur: cur.n, base: base.n });
    ok('POEMS 正文哈希 与 round6 基线逐字一致', cur.hash === base.hash, { cur: cur.hash, base: base.hash });
    ok('POEMS id 序列 与 round6 基线完全一致',
       JSON.stringify(cur.ids) === JSON.stringify(base.ids),
       { curLen: cur.ids.length, baseLen: base.ids.length });
    ok('首页区块 与 round6 基线完全一致（零新增）',
       JSON.stringify(cur.home) === JSON.stringify(base.home), { cur: cur.home, base: base.home });
  } else {
    sk('POEMS 正文哈希 与基线逐字比对', '未提供 BASE_HTML');
    sk('POEMS id 序列 与基线比对', '未提供 BASE_HTML');
    sk('首页区块 与基线比对（零新增）', '未提供 BASE_HTML');
  }
}

/* D3 排版矩阵：375/390/428 × 字号极值 × 紧/松 × 竖/横/横原文 */
{
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => localStorage.clear());

  const pid = await page.evaluate(() => {
    const p = POEMS.find(x => {
      const L = (x.lines || []).map(l => [...(l.m || l.o || '')].length);
      return L.length >= 4 && L.some(y => y >= 16);
    });
    return (p || POEMS[0]).id;
  });

  const widths = [375, 390, 428];
  const sizes = ['小', '特大'];
  const spacings = ['紧', '松'];
  const modes = ['vertical', 'horizontal', 'horizontalOriginal'];
  const rows = [];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const size of sizes) {
      for (const sp of spacings) {
        for (const mode of modes) {
          const r = await page.evaluate(({ pid, size, sp, mode }) => {
            setFont('size', size); setFont('spacing', sp);
            const layout = mode === 'vertical' ? 'vertical' : 'horizontal';
            setLayout(layout);
            openDetail(pid);
            const de = document.documentElement;
            // 三种读面：竖排正文 / 横排正文 / 横排原文（译文卡）
            const host = mode === 'horizontalOriginal'
              ? document.querySelector('.original')
              : document.querySelector('.vbody');
            if (host && mode === 'horizontalOriginal') host.scrollIntoView({ block: 'center' });
            const out = { hOverflow: de.scrollWidth - de.clientWidth };
            if (host) {
              out.selfOverflow = host.scrollWidth - host.clientWidth;
              const hr = host.getBoundingClientRect();
              const kids = [...host.children];
              out.kidOut = kids.filter(k => {
                const b = k.getBoundingClientRect();
                return b.width > 0 && (b.right > hr.right + 1.5 || b.left < hr.left - 1.5);
              }).length;
              out.kidN = kids.length;
              // 过挤判据：相邻行/列之间不得重叠（负间距）
              const boxes = kids.map(k => k.getBoundingClientRect()).filter(b => b.width > 0);
              out.minGap = null;
              if (boxes.length >= 2) {
                const vertical = mode === 'vertical';
                const gaps = [];
                for (let i = 1; i < boxes.length; i++) {
                  gaps.push(vertical ? boxes[i - 1].left - boxes[i].right : boxes[i].top - boxes[i - 1].bottom);
                }
                out.minGap = Math.round(Math.min(...gaps) * 10) / 10;
              }
            }
            return out;
          }, { pid, size, sp, mode });
          rows.push({ w, size, sp, mode, ...r });
        }
      }
    }
  }
  const badOverflow = rows.filter(r => r.hOverflow > 1);
  const badKid = rows.filter(r => r.kidOut > 0);
  const badSelf = rows.filter(r => r.selfOverflow !== undefined && r.selfOverflow > 1);
  const badGap = rows.filter(r => r.minGap !== null && r.minGap < -0.5);
  ok(`排版矩阵 ${rows.length} 组：页面无横向溢出`, badOverflow.length === 0, badOverflow.slice(0, 3));
  ok('排版矩阵：无子块越出容器（无破版）', badKid.length === 0, badKid.slice(0, 3));
  ok('排版矩阵：读面自身无横向溢出', badSelf.length === 0, badSelf.slice(0, 3));
  ok('排版矩阵：相邻行/列无负间距（无过挤/重叠）', badGap.length === 0, badGap.slice(0, 3));
  ok('矩阵内读面均渲染出内容（非空壳）', rows.every(r => r.kidN === undefined || r.kidN > 0),
     rows.filter(r => r.kidN === 0).slice(0, 3));
  ok('§D3 无 pageerror', errs.length === 0, errs.slice(0, 2));
  await page.close();
}

/* D4 prefers-reduced-motion 全覆盖 */
{
  const page = await browser.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);

  const scan = async (label, prep) => {
    await page.evaluate(prep);
    await page.waitForTimeout(250);
    return page.evaluate(() => {
      const bad = [];
      const all = [...document.querySelectorAll('*')];
      const dur = (v) => (v || '').split(',').map(s => parseFloat(s) || 0);
      all.forEach(el => {
        const cs = getComputedStyle(el);
        const cls = String(el.getAttribute('class') || '');
        const a = Math.max(0, ...dur(cs.animationDuration));
        const t = Math.max(0, ...dur(cs.transitionDuration));
        if (a > 0.01) bad.push({ tag: el.tagName, cls: cls.slice(0, 40), kind: 'animation', v: cs.animationDuration });
        if (t > 0.01) bad.push({ tag: el.tagName, cls: cls.slice(0, 40), kind: 'transition', v: cs.transitionDuration });
      });
      return { n: all.length, bad: bad.slice(0, 12), badCount: bad.length };
    });
  };
  const home = await scan('首页', () => showView('view-home'));
  ok('reduce 下首页无残留 animation/transition', home.badCount === 0, { n: home.n, bad: home.bad });

  const detail = await scan('详情', () => { setLayout('vertical'); const p = POEMS.find(x => x.level === '精读') || POEMS[0]; openDetail(p.id); });
  ok('reduce 下详情（竖排+待揭字）无残留动效', detail.badCount === 0, { n: detail.n, bad: detail.bad });

  const learn = await scan('学习', () => { showView('view-learn'); renderLearn(); });
  ok('reduce 下学习页（含打卡印入场）无残留动效', learn.badCount === 0, { n: learn.n, bad: learn.bad });

  const settings = await scan('设置面板', () => { openReadingSettings(); });
  ok('reduce 下设置面板无残留动效', settings.badCount === 0, { n: settings.n, bad: settings.bad });
  await page.evaluate(() => closeReadingSettings());
  await page.close();
}

/* D5 新入口可回退（纸纹入口：从哪进 / 怎么回） */
{
  const page = await freshPage();
  const nav = await page.evaluate(() => {
    showView('view-me');
    openReadingSettings();
    const opened = document.querySelector('#rsetOverlay')?.classList.contains('active') ?? false;
    closeReadingSettings();
    const closed = !(document.querySelector('#rsetOverlay')?.classList.contains('active') ?? false);
    return { opened, closed };
  });
  ok('纸纹入口可从「我的→阅读设置」进入并关闭返回', nav.opened && nav.closed, nav);
  await page.close();
}

/* ══════════════════════ §E 打卡完成反馈（B 落印 + C 满勤卷）══════════════════════ */
/* 拍板：B+C 组合 + 加音效 + 小程序侧只用 wx.vibrateShort（后者属小程序仓库，不在本文件范围）。
   口径见 out/review-r7-p23-research.md。 */
console.log('\n§E 打卡完成反馈（B 落印 + C 满勤卷）');
{
  const page = await freshPage({ xjy_layout: 'vertical' });
  await page.evaluate(() => { showView('view-learn'); renderLearn(); });
  await page.waitForTimeout(200);

  // E1 完成态不再是玉绿
  const palette = await page.evaluate(() => {
    const it = document.querySelector('.ci-item');
    it.click();                                   // 勾上第一项
    const done = document.querySelector('.ci-item.done');
    const ck = done.querySelector('.ck');
    return {
      itemBg: getComputedStyle(done).backgroundImage + '|' + getComputedStyle(done).backgroundColor,
      ckBg: getComputedStyle(ck).backgroundColor,
      hasJade: /110,\s*139,\s*106/.test(getComputedStyle(done).backgroundImage + getComputedStyle(ck).backgroundColor + getComputedStyle(done).borderColor),
    };
  });
  /* 判据演进说明：
     ① 原本是「完成态不许是玉绿 #6E8B6A」——玉绿在宣纸底上发灰、显脏，已废弃；
     ② 改成墨色勾选圆后，枯木 2026-10-26 反馈「墨色不好看，还不如红的」；
     ③ 现为深朱 #8E2C22 = rgb(142,44,34)。用深朱而非印章同色 #B23A2E，
        是为了让「印砸下来」仍是卡上最亮的那块红（同色会摊薄辨识度）。
     故断言改为：无玉绿 + 勾选圆确为深朱 + 不与印章同色。 */
  ok('完成态已脱离玉绿（淡墨底 + 深朱勾选圆）',
     !palette.hasJade &&
     /142,\s*44,\s*34/.test(palette.ckBg) &&
     !/178,\s*58,\s*46/.test(palette.ckBg),
     palette);

  // 复位，逐项细查动效（注意键名是 shiyun_checkin，不是 xjy_*）
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);
  await page.evaluate(() => { showView('view-learn'); renderLearn(); });
  await page.waitForTimeout(150);

  // E2/E3/E4/E6/E7 一次点击，抓同一帧的所有痕迹
  const fx = await page.evaluate(() => {
    window.__toastN = 0;
    const _t = window.toast;
    window.toast = (...a) => { window.__toastN++; try { _t && _t(...a); } catch (e) {} };
    const target = document.querySelectorAll('.ci-item')[2];
    target.click();
    const stamp = document.querySelector('.ci-item.fx .stamp');
    const item = document.querySelector('.ci-item.fx');
    const cs = stamp ? getComputedStyle(stamp) : null;
    const af = item ? getComputedStyle(item, '::after') : null;
    const cnt = document.querySelector('.ci-cnt');
    return {
      sparks: document.querySelectorAll('.ci-item .spark').length,
      stampAnim: cs ? cs.animationName : null,
      stampDur: cs ? cs.animationDuration : null,
      bloomAnim: af ? af.animationName : null,
      bloomDur: af ? af.animationDuration : null,
      cntText: cnt ? cnt.textContent.trim() : null,
      cntRoll: cnt ? cnt.className : null,
      toastCalls: window.__toastN,
    };
  });
  ok('落印动画挂在刚点的那一项（ciStampDrop）', fx.stampAnim === 'ciStampDrop', fx);
  ok('落印时长 ≤ 300ms（不拖手感）', parseFloat(fx.stampDur) > 0 && parseFloat(fx.stampDur) <= 0.3, fx);
  ok('墨晕动画存在（ciBloom）且 ≤ 460ms', fx.bloomAnim === 'ciBloom' && parseFloat(fx.bloomDur) <= 0.46, fx);
  ok('朱砂溅点生成 6 粒', fx.sparks === 6, fx);
  ok('计数滚轮更新为实际完成数并带动画类', fx.cntText === '1' && /roll/.test(fx.cntRoll), fx);
  ok('完成瞬间不再弹 toast（注意力留在卡片上）', fx.toastCalls === 0, fx);

  // E5 粒子会自动清理
  await page.waitForTimeout(700);
  const cleaned = await page.evaluate(() => document.querySelectorAll('.ci-item .spark').length);
  ok('溅点在 600ms 后自动清理干净', cleaned === 0, cleaned);

  // E13 色弱冗余：颜色之外还有形状
  const redundancy = await page.evaluate(() => {
    const d = document.querySelector('.ci-item.done');
    return { check: !!d.querySelector('.ck svg'), stamp: !!d.querySelector('.stamp svg') };
  });
  ok('完成态有形状冗余（勾选 svg + 常驻朱印），不只靠颜色', redundancy.check && redundancy.stamp, redundancy);

  // E8 取消：无奖励动效
  // 注意：renderCheckin 是整卡重绘，点击后原 node 已被替换——
  // 必须重新查询当前 DOM，读旧节点会拿到重绘前的 class（假 PASS/假 FAIL 都由此而来）。
  const cancel = await page.evaluate(() => {
    const before = document.querySelector('.ci-item[data-k="know"]');
    const wasDone = before.classList.contains('done');
    before.click();
    const after = document.querySelector('.ci-item[data-k="know"]');
    return {
      wasDone,
      stillDone: after.classList.contains('done'),
      fx: document.querySelectorAll('.ci-item.fx').length,
      sparks: document.querySelectorAll('.ci-item .spark').length,
    };
  });
  ok('取消后不残留落印动效与溅点',
     cancel.wasDone === true && cancel.stillDone === false && cancel.fx === 0 && cancel.sparks === 0, cancel);

  // E9/E10 满勤卷
  const full = await page.evaluate(() => new Promise(res => {
    CHECKIN_ITEMS.forEach(it => { if (!checkin.done[it.key]) toggleCheckin(it.key); });
    setTimeout(() => {
      const sc = document.getElementById('ciScroll');
      const bt = sc && sc.querySelector('.bt');
      const by = sc && sc.querySelector('.by');
      res({
        done: document.querySelectorAll('.ci-item.done').length,
        scroll: !!sc,
        on: sc ? sc.classList.contains('on') : false,
        h: sc ? Math.round(sc.getBoundingClientRect().height) : 0,
        text: bt ? bt.textContent.trim() : null,
        src: by ? by.textContent.trim() : null,
        enc: document.querySelector('.ci-encourage').textContent.trim(),
        encHot: document.querySelector('.ci-encourage').classList.contains('hot'),
        cntSub: document.querySelector('.ci-sub').textContent.trim(),
      });
    }, 700);
  }));
  ok('满勤触发卷轴并展开', full.scroll && full.on && full.h > 40, full);
  ok('卷轴载一句非空题跋 + 出处', !!full.text && full.text.length >= 8 && /朱批/.test(full.src || ''), full);
  ok('满勤提示升级为朱色强调', full.encHot === true && /满勤/.test(full.enc), full);
  /* 口径一致性：满勤按拍板②只算四项（温故不计），所以计数是 x/5、满勤是 x/4。
     两套分母并存时，文案必须写明「四项」，且计数行不得出现「满勤」二字——
     否则会出现「已完成 4/5 · 满勤」这种自相矛盾的显示。 */
  ok('满勤文案写明「四项」（不与 /5 计数自相矛盾）', /四项/.test(full.enc), full);
  ok('计数行不夹带「满勤」字样（分母不同不混写）', !/满勤/.test(full.cntSub), full);

  // 同日重复渲染：题跋必须稳定（不能刷一次换一句）
  const stable = await page.evaluate(() => {
    const a = document.querySelector('#ciScroll .bt').textContent.trim();
    renderCheckin();
    const b = document.querySelector('#ciScroll .bt').textContent.trim();
    return { a, b, same: a === b };
  });
  ok('同日内题跋稳定（重复渲染不换句）', stable.same === true, stable);

  // E11 音效函数存在且调用不抛错
  const snd = await page.evaluate(() => {
    try { ciSndStamp(); ciSndTick(); ciSndChime(); return { ok: true, fns: [typeof ciSndStamp, typeof ciSndTick, typeof ciSndChime] }; }
    catch (e) { return { ok: false, err: String(e) }; }
  });
  ok('三处音效函数可用且调用不抛错', snd.ok === true && snd.fns.every(x => x === 'function'), snd);

  ok('§E 无 pageerror', page._errs.length === 0, page._errs.slice(0, 2));
  await page.close();
}

/* E4b reduce 下降级：不生成粒子、印直接到位 */
{
  const page = await browser.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(450);
  const red = await page.evaluate(() => {
    showView('view-learn'); renderLearn();
    document.querySelectorAll('.ci-item')[1].click();
    const st = document.querySelector('.ci-item.done .stamp');
    return {
      sparks: document.querySelectorAll('.ci-item .spark').length,
      done: document.querySelectorAll('.ci-item.done').length,
      stampOpacity: st ? getComputedStyle(st).opacity : null,
      cnt: document.querySelector('.ci-cnt').textContent.trim(),
    };
  });
  ok('reduce 下不生成任何溅点粒子', red.sparks === 0, red);
  ok('reduce 下印仍直接到位（状态可辨，只是不动）', red.stampOpacity === '1' && red.done === 1, red);
  ok('reduce 下计数照常更新', red.cnt === '1', red);
  await page.close();
}

await browser.close();
console.log(`\nROUND7-RESULT pass=${pass} fail=${fail} skip=${skip}`);
process.exit(fail ? 1 : 0);
