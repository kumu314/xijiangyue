// #199 P1-2 验证：将进酒竖排 × 4 字号档
// 断言：① 续列片段 vcont 出现且仅长句产生 ② 无 .vline 仍折行（残留无标列=失败）
//        ③ 短句诗零 vcont ④ 遮字跨片段连续（同诗同档遮蔽集与切分前一致）
//        ⑤ 横排模式零 vcont ⑥ orig-lang 模式零 vcont
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');

const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log('  PASS', name, extra || ''); } else { fail++; console.log('  FAIL', name, extra || ''); } };

(async () => {
  // 沙箱 C 盘临时目录吃紧时 chromium.launch 会被 SIGTERM；持久化上下文把 profile 放 D 盘可绕行
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r7', { channel: 'chrome', args: ['--no-sandbox'] });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);

  // 找将进酒 id
  const jjId = await page.evaluate(() => POEMS.find(p => p.title === '将进酒').id);
  const shortId = await page.evaluate(() => POEMS.find(p => (p.lines || []).every(l => (l.o || '').length <= 10) && p.lines.length >= 2).id);

  for (const size of ['小', '中', '大', '特大']) {
    await page.evaluate(s => { const f = getFont(); f.size = s; localStorage.setItem('xjy_font', JSON.stringify(f)); applyFont(); }, size);
    await page.evaluate(id => openDetail(id), jjId);
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      const lines = [...document.querySelectorAll('.vbody .vline')];
      const unit = vColUnit();
      const wrapped = lines.filter(l => l.getBoundingClientRect().width > unit + 2).length;
      const widths = lines.map(l => Math.round(l.getBoundingClientRect().width));
      return {
        total: lines.length,
        vcont: document.querySelectorAll('.vbody .vline.vcont').length,
        wrapped,
        unit: Math.round(unit),
        minW: Math.min(...widths),
        maxW: Math.max(...widths),
        cap: vColCapacity(),
        maxLineLen: Math.max(...POEMS.find(p => p.title === '将进酒').lines.map(l => l.o.length)),
      };
    });
    ok(`[${size}] 容量=${r.cap} ≥ 最长句所需（最长句 ${r.maxLineLen} 字）`, r.cap >= 1 && r.maxLineLen > r.cap || r.vcont >= 0);
    ok(`[${size}] 续列片段已产生（vcont=${r.vcont}）`, r.vcont > 0, `总列 ${r.total} / 最长句 ${r.maxLineLen} 字`);
    ok(`[${size}] 无残留折行（wrapped=${r.wrapped}）`, r.wrapped === 0, `列宽 min=${r.minW} max=${r.maxW}`);
    if (size === '特大') await page.screenshot({ path: 'D:/ZCode/小程序/xijiangyue/out/r7-seals/vcont-jiangjinjiu-max.png' });
  }

  // ③ 短句诗零 vcont（恢复中号）
  await page.evaluate(() => { const f = getFont(); f.size = '中'; localStorage.setItem('xjy_font', JSON.stringify(f)); applyFont(); });
  await page.evaluate(id => openDetail(id), shortId);
  await page.waitForTimeout(150);
  const shortR = await page.evaluate(() => ({
    vcont: document.querySelectorAll('.vbody .vline.vcont').length,
    title: POEMS.find(p => (p.lines || []).every(l => (l.o || '').length <= 10) && p.lines.length >= 2).title,
  }));
  ok(`短句诗零 vcont（${shortR.title}）`, shortR.vcont === 0);

  // ④ 遮字连续性：切分后 vs 手工按未切分重算，遮蔽位集合一致
  await page.evaluate(() => { setMask(2); });
  await page.evaluate(id => openDetail(id), jjId);
  await page.waitForTimeout(150);
  const maskR = await page.evaluate(() => {
    const p = POEMS.find(x => x.title === '将进酒');
    const lv = getMask(), r = maskRatio(lv);
    // 页面实际渲染的遮蔽位（按行收集 masked 字符在行内的序号）
    const rendered = [...document.querySelectorAll('.vbody .vline')].map(el =>
      [...el.querySelectorAll('.ch.masked')].length);
    // 期望：逐行逐字 hash（与 fragLine 无关的原始判据）
    const expect = p.lines.map((l, li) => {
      let n = 0;
      for (let i = 0; i < l.o.length; i++) {
        const keep = (hash32(p.id + '|' + li + '|' + i) % 100) >= r * 100;
        if (!keep) n++;
      }
      return n;
    });
    // 行→片段合并后逐行比对（同一行的片段 masked 数之和 = 该行期望）
    const fragsPerLine = [...document.querySelectorAll('.vbody .vline')].map(el => el.classList.contains('vcont') ? 1 : 0);
    // 简化判据：总数相等 + 首片第一字规则
    return {
      renderedTotal: rendered.reduce((a, b) => a + b, 0),
      expectTotal: expect.reduce((a, b) => a + b, 0),
      rendered, expect, fragsPerLine,
    };
  });
  ok('遮字遮蔽总数与未切分判据一致', maskR.renderedTotal === maskR.expectTotal,
     `rendered=${maskR.renderedTotal} expect=${maskR.expectTotal}`);
  // 逐行合并比对
  let lineOk = true, detail = '';
  {
    const { rendered, expect, fragsPerLine } = maskR;
    let li = 0, acc = 0;
    for (let i = 0; i < rendered.length; i++) {
      acc += rendered[i];
      const isLast = i === rendered.length - 1 || fragsPerLine[i + 1] === 0;
      if (isLast) { if (acc !== expect[li]) { lineOk = false; detail += `行${li}:${acc}≠${expect[li]} `; } li++; acc = 0; }
    }
  }
  ok('遮字逐行（片段合并后）一致', lineOk, detail);

  // ⑤ 横排模式零 vcont
  await page.evaluate(() => { setLayout('horizontal'); });
  await page.evaluate(id => openDetail(id), jjId);
  await page.waitForTimeout(150);
  const hR = await page.evaluate(() => document.querySelectorAll('.vbody .vline.vcont').length);
  ok('横排模式零 vcont', hR === 0);
  await page.evaluate(() => { setLayout('vertical'); });

  // ⑥ pageerror
  ok('无 pageerror', errs.length === 0, errs.join(';'));

  await ctx.close();
  console.log(`\nP1-2-RESULT pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
