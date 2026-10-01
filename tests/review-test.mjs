/* 西江阅 round5-② 温故（#57）· 行为断言
   覆盖施工单红线：全勤显式排除温项 / 日期本地日（修 UTC bug）/ 每日上限 10 + 超期降档 /
   leech 规则 / learned 分离另设 reviewCount / .ci-grid 五印布局 / 无到期显示距离下次 N 天 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const OUT = 'D:/AgentHub/agent-bridge/out/review-fix';
fs.mkdirSync(OUT, { recursive: true });
const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';

let pass = 0, fail = 0;
const ok = (n, c, extra) => {
  if (c) { pass++; console.log('  ✓ ' + n); }
  else { fail++; console.log('  ✗ ' + n + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
async function open(fixedTime) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  if (fixedTime) {
    await page.clock.install({ time: new Date(fixedTime) });
  }
  await page.route('**/*', (r) => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.evaluate(() => { showView('view-learn'); renderLearn(); });
  await page.waitForTimeout(200);
  return { ctx, page };
}
/* 造 review 数据：ids 到期（due<=today），overdueDays<0 表示超期 */
async function seedReview(page, spec) {
  return page.evaluate((spec) => {
    const today = localDay();
    const shift = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localDay(d); };
    const r = {};
    spec.forEach((s, i) => {
      const p = POEMS.find(x => x.id === s.id) || POEMS[i];
      r[p.id] = { bucket: s.bucket ?? 0, due: s.due ?? shift(s.dueIn ?? 0), last: shift(-1), slip: s.slip ?? 0, leech: !!s.leech };
    });
    localStorage.setItem('xjy_review', JSON.stringify(r));
    return r;
  }, spec);
}

/* ============ 1. 本地日（修 UTC bug） ============ */
console.log('\n=== 1. 日期本地日 ===');
{
  // 本地 2026-10-02 02:00 = UTC 2026-10-01 18:00 → toISOString().slice(0,10) 会错成 10-01
  const { ctx, page } = await open('2026-10-02T02:00:00');
  const d = await page.evaluate(() => {
    const utc = new Date().toISOString().slice(0, 10);
    return { utc, local: localDay(), yesterday: getYesterday(), checkinDate: (JSON.parse(localStorage.getItem('shiyun_checkin') || '{}')).date };
  });
  ok('D1 UTC 日在早 8 点前确实错位（证明 bug 真实存在）', d.utc === '2026-10-01', d);
  ok('D2 localDay = 本地日 2026-10-02', d.local === '2026-10-02', d);
  ok('D3 getYesterday 走本地日 = 2026-10-01', d.yesterday === '2026-10-01', d);
  ok('D4 打卡记录日期 = 本地日（非 UTC 错位值）', d.checkinDate === '2026-10-02', d);
  await page.screenshot({ path: OUT + '/1-localday.png' });
  await ctx.close();
}

/* ============ 2. 五印布局 ============ */
console.log('\n=== 2. .ci-grid 五印布局 ===');
{
  const { ctx, page } = await open();
  const g = await page.evaluate(() => {
    const items = [...document.querySelectorAll('.ci-item')];
    const last = items[items.length - 1];
    const cs = last ? getComputedStyle(last) : null;
    return {
      count: items.length,
      lastWide: last ? last.classList.contains('wide') : false,
      span: cs ? cs.gridColumn : null,
      cols: getComputedStyle(document.querySelector('.ci-grid')).gridTemplateColumns,
      texts: items.map(i => i.querySelector('.ct') && i.querySelector('.ct').textContent),
    };
  });
  ok('C1 打卡项 5 个（含第 5 印「温」）', g.count === 5, g.count);
  ok('C2 第 5 项带 wide（独占一行）', g.lastWide === true, g);
  ok('C3 wide 生效为 grid-column 1/-1', /1/.test(g.span || ''), g.span);
  ok('C4 第 5 项文本 = 每日温故', g.texts[4] === '每日温故', g.texts);
  await page.screenshot({ path: OUT + '/2-five-seals.png' });
  await ctx.close();
}

/* ============ 3. 全勤显式排除温项 + reviewCount 分离 ============ */
console.log('\n=== 3. 全勤排除温 / learned 分离 ===');
{
  const { ctx, page } = await open();
  const r0 = await page.evaluate(() => {
    localStorage.removeItem('shiyun_checkin');
    localStorage.setItem('shiyun_progress', JSON.stringify({ learned: 100, streak: 3 }));
    progress = JSON.parse(localStorage.getItem('shiyun_progress'));
    checkin = null; renderCheckin();
    // 勾满四项（不含温）
    ['read', 'watch', 'know', 'memory'].forEach(k => toggleCheckin(k));
    return { learned: progress.learned, streak: progress.streak, sub: document.querySelector('.ci-sub').textContent };
  });
  ok('S1 四项全勤（不含温）→ 满勤文案出现', /今日已全部完成/.test(r0.sub), r0.sub);
  ok('S2 四项各 +1 learned = 104', r0.learned === 104, r0);

  const r1 = await page.evaluate(() => {
    const before = { learned: progress.learned, reviewCount: progress.reviewCount || 0 };
    toggleCheckin('review');   // 勾温
    return { before, after: { learned: progress.learned, reviewCount: progress.reviewCount || 0 }, sub: document.querySelector('.ci-sub').textContent };
  });
  ok('S3 勾「温」learned 不增加（口径分离）', r1.after.learned === r1.before.learned, r1);
  ok('S4 勾「温」reviewCount +1', r1.after.reviewCount === r1.before.reviewCount + 1, r1);

  const r2 = await page.evaluate(() => {
    // 只勾温 + 三项（缺一个必做项）→ 不得算满勤
    localStorage.removeItem('shiyun_checkin');
    checkin = null; renderCheckin();
    ['read', 'watch', 'know', 'review'].forEach(k => toggleCheckin(k));
    return { sub: document.querySelector('.ci-sub').textContent, album: (JSON.parse(localStorage.getItem('shiyun_album') || '[]')).length };
  });
  ok('S5 缺必做项时（勾了温）不算满勤', !/今日已全部完成/.test(r2.sub), r2.sub);
  ok('S6 未收印（印谱不因温项满勤）', r2.album === 0, r2);
  await page.screenshot({ path: OUT + '/3-review-excluded.png' });
  await ctx.close();
}

/* ============ 4. 到期队列：上限 10 + 超期降档 + leech ============ */
console.log('\n=== 4. 今日温故队列 ===');
{
  const { ctx, page } = await open();
  const ids = await page.evaluate(() => POEMS.filter(x => !(x.orig_lang && x.orig_lang !== 'zh')).slice(0, 15).map(x => x.id));
  // 15 首全部到期（dueIn=0 表示 today）
  await seedReview(page, ids.map(id => ({ id, dueIn: 0, bucket: 2 })));
  const q = await page.evaluate(() => { renderCheckin(); const d = reviewDueList(); return { n: d.length, first: d[0] && d[0].id, cardN: document.querySelector('.rv-n') && document.querySelector('.rv-n').textContent }; });
  ok('Q1 到期队列 15 首全入队', q.n === 15, q);
  ok('Q2 卡片显示上限 10 首 + 积压 15', /10 首/.test(q.cardN || '') && /积压 15/.test(q.cardN || ''), q.cardN);

  // 超期降档：造 1 首超期 3 天
  await seedReview(page, [{ id: ids[0], dueIn: -3, bucket: 3 }]);
  const dg = await page.evaluate(() => {
    const before = JSON.parse(localStorage.getItem('xjy_review'));
    renderCheckin();   // 触发 applyOverdueDowngrade
    const after = JSON.parse(localStorage.getItem('xjy_review'));
    const id = Object.keys(before)[0];
    return { b: before[id], a: after[id] };
  });
  ok('Q3 超期降档：bucket 3 → 2', dg.a.bucket === dg.b.bucket - 1, dg);
  ok('Q4 超期 slip +1', dg.a.slip === (dg.b.slip || 0) + 1, dg);
  ok('Q5 降档后仍在今日队列（due 不变）', dg.a.due === dg.b.due, dg);
  const dg2 = await page.evaluate(() => { renderCheckin(); const r = JSON.parse(localStorage.getItem('xjy_review')); const id = Object.keys(r)[0]; return r[id]; });
  ok('Q6 同一天重复渲染不重复降档（slipDay 幂等）', dg2.slip === dg.a.slip, dg2);

  // leech：slip=3
  await seedReview(page, [{ id: ids[0], dueIn: -5, bucket: 4, slip: 2 }]);
  const lc = await page.evaluate(() => { renderCheckin(); const r = JSON.parse(localStorage.getItem('xjy_review')); return r[Object.keys(r)[0]]; });
  ok('Q7 leech：slip 达 3 → bucket 降回 0（1 天桶）', lc.bucket === 0, lc);
  ok('Q8 leech 标记置位', lc.leech === true, lc);
  const note = await page.evaluate(() => { const n = document.querySelector('.rv-note'); return n && n.textContent; });
  ok('Q9 leech UI 温和提示出现', /连续回炉/.test(note || ''), note);
  await page.screenshot({ path: OUT + '/4-due-queue.png' });
  await ctx.close();
}

/* ============ 5. 无到期日提示 ============ */
console.log('\n=== 5. 无到期日 ===');
{
  const { ctx, page } = await open();
  const ids = await page.evaluate(() => POEMS.slice(0, 2).map(x => x.id));
  await seedReview(page, [{ id: ids[0], dueIn: 5 }]);
  const e1 = await page.evaluate(() => { renderCheckin(); return document.querySelector('.rv-empty') && document.querySelector('.rv-empty').textContent; });
  ok('N1 无到期 → 显示「距离下次 N 天」', /今日无到期，距离下次 5 天/.test(e1 || ''), e1);
  await page.evaluate(() => localStorage.removeItem('xjy_review'));
  const e2 = await page.evaluate(() => { renderCheckin(); return document.querySelector('.rv-empty') && document.querySelector('.rv-empty').textContent; });
  ok('N2 队列空 → 显示「暂无温故安排」（不显示为未完成）', /暂无温故安排/.test(e2 || ''), e2);
  await page.screenshot({ path: OUT + '/5-empty.png' });
  await ctx.close();
}

await browser.close();
console.log(`\n════════ 温故 #57 汇总 ════════`);
console.log(`通过 ${pass} / 失败 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
