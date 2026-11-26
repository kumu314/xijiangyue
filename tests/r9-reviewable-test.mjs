/* 西江阅 round9 · web reviewable 外国诗排除断言（灵玉 #347 §三-1 拉回同构）
   ─────────────────────────────────────────────────────────────
   判据范围：
     §A reviewable 本体语义：category==='外国诗' 一律不可温故（补 orig_lang 漏挡）
     §B 不误伤：非外国诗 orig_lang 非 zh 仍挡、中文诗仍放行
     §C 行为层：touchReview / bumpReview / reviewDueList / nextDueDays 均不收外国诗
     §D 双端口径同构（对齐小程序 isForeign：category 或 orig_lang 任一命中即外国诗）

   跑法：TEST_HTML=<副本> node tests/r9-reviewable-test.mjs
   反向注入：TEST_HTML=<故意把 reviewable 改回旧版的副本> → 应红。
   启动方式复用 r8：launchPersistentContext + D 盘 profile/TMP（C 盘紧张会被 SIGTERM 连杀）。
*/
process.env.TMPDIR = process.env.TMPDIR || 'D:/AgentHub/tmp';
process.env.TEMP = process.env.TEMP || 'D:/AgentHub/tmp';
process.env.TMP = process.env.TMP || 'D:/AgentHub/tmp';
import { chromium } from 'playwright-core';

const TEST_HTML = process.env.TEST_HTML || '';
const URL_ = TEST_HTML || 'file:///D:/ZCode/小程序/xijiangyue/index.html';
const PROFILE = 'D:/AgentHub/tmp/chrome-r8-test';

let pass = 0, fail = 0;
const ok = (n, c, extra) => {
  if (c) { pass++; console.log('  ✓ ' + n); }
  else { fail++; console.log('  ✗ ' + n + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};

const browser = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 },
});
const page = await browser.newPage();
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
console.log('被测：' + URL_ + (TEST_HTML ? '   ← TEST_HTML 指定，非产品文件！' : ''));

/* ===== A. reviewable 本体：合成样本覆盖三种外国诗形态 ===== */
console.log('\n=== A. reviewable 本体语义 ===');
const sem = await page.evaluate(() => {
  const mk = (o) => Object.assign({ id: 'x', title: 'X', lines: ['a'] }, o);
  return {
    foreignNoLang: reviewable(mk({ category: '外国诗' })),                       // 云数据 15 首缺 orig_lang
    foreignZh: reviewable(mk({ category: '外国诗', orig_lang: 'zh' })),          // 云数据 1 首标 zh = w_zuiyaoyuan
    foreignEn: reviewable(mk({ category: '外国诗', orig_lang: 'en' })),          // 已被旧版挡住，补后仍须挡
    foreignNull: reviewable(null),
    cnPlain: reviewable(mk({ category: '诗' })),                                 // 中文诗放行
    cnCi: reviewable(mk({ category: '词', orig_lang: 'zh' })),                   // 标 zh 的非外国诗放行
    nonForeignBadLang: reviewable(mk({ category: '诗', orig_lang: 'en' })),      // 非外国诗但标外语 → 旧版挡，补后仍挡
  };
});
ok('A1 category=外国诗 且缺 orig_lang → 不可温故（云数据 15 首原型）', sem.foreignNoLang === false, sem);
ok('A2 category=外国诗 且 orig_lang=zh → 不可温故（w_zuiyaoyuan 原型）', sem.foreignZh === false, sem);
ok('A3 category=外国诗 且 orig_lang=en → 仍不可温故（不回退旧能力）', sem.foreignEn === false, sem);
ok('A4 空指针 → 不可温故', sem.foreignNull === false, sem);
ok('A5 中文诗（category=诗，无 orig_lang）→ 可温故（不误伤）', sem.cnPlain === true, sem);
ok('A6 中文词（category=词，orig_lang=zh）→ 可温故（不误伤）', sem.cnCi === true, sem);
ok('A7 非外国诗但 orig_lang=en → 仍不可温故（旧能力保留）', sem.nonForeignBadLang === false, sem);

/* ===== B. 全量：网页 1025 首外国诗无一漏挡 ===== */
console.log('\n=== B. 网页全量 1025 首 ===');
const full = await page.evaluate(() => {
  const foreign = POEMS.filter(p => p.category === '外国诗');
  const leaked = foreign.filter(p => reviewable(p));
  const nonForeign = POEMS.filter(p => p.category !== '外国诗');
  const nonForeignLeaked = nonForeign.filter(p => !(p.orig_lang && p.orig_lang !== 'zh') && !reviewable(p));
  return {
    total: POEMS.length,
    foreignN: foreign.length,
    leakedN: leaked.length,
    leakedIds: leaked.map(p => p.id),
    nonForeignN: nonForeign.length,
    nonForeignBlocked: nonForeign.length - nonForeign.filter(p => reviewable(p)).length,
    nonForeignLeakedN: nonForeignLeaked.length,
    wzy: foreign.find(p => p.id === 'w_zuiyaoyuan')
      ? { reviewable: reviewable(foreign.find(p => p.id === 'w_zuiyaoyuan')),
          orig_lang: foreign.find(p => p.id === 'w_zuiyaoyuan').orig_lang } : null,
  };
});
ok('B1 网页 POEMS = 1025 首（分母锚点）', full.total === 1025, full.total);
ok('B2 外国诗 = 102 首（口径锚点）', full.foreignN === 102, full.foreignN);
ok('B3 外国诗漏挡 = 0（旧版实测 1 首 w_zuiyaoyuan）', full.leakedN === 0, full);
ok('B4 w_zuiyaoyuan（orig_lang=zh）已被挡', full.wzy && full.wzy.reviewable === false, full.wzy);
ok('B5 非外国诗被挡仅 orig_lang 非 zh 者（无误伤）', full.nonForeignLeakedN === 0, full);

/* ===== C. 行为层：四个入口都不收外国诗 ===== */
console.log('\n=== C. 行为层 ===');
const beh = await page.evaluate(() => {
  const today = localDay();
  const shift = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localDay(d); };
  const w = POEMS.find(p => p.id === 'w_zuiyaoyuan');
  const cn = POEMS.find(p => p.category !== '外国诗' && !(p.orig_lang && p.orig_lang !== 'zh'));
  localStorage.removeItem('xjy_review');
  // 外国诗：手工塞一条到期记录（模拟旧版误入队后的存量数据）
  const r = {};
  r[w.id] = { bucket: 0, due: shift(-1), last: shift(-3), v: 2 };
  r[cn.id] = { bucket: 0, due: shift(-1), last: shift(-3), v: 2 };
  localStorage.setItem('xjy_review', JSON.stringify(r));
  const due = reviewDueList().map(x => x.id);
  const next = nextDueDays();
  // bumpReview 对外国诗返回 0（不入桶）
  const bumpForeign = bumpReview(w.id);
  // touchReview 不写外国诗
  localStorage.removeItem('xjy_review');
  touchReview(w);
  const afterTouch = JSON.parse(localStorage.getItem('xjy_review') || '{}');
  // nextDueDays 只算未来到期：造「外国诗 2 天后 + 中文诗 5 天后」→ 修复后应只见 5
  const r2 = {};
  r2[w.id] = { bucket: 0, due: shift(2), last: today };
  r2[cn.id] = { bucket: 0, due: shift(5), last: today };
  localStorage.setItem('xjy_review', JSON.stringify(r2));
  const nextFuture = nextDueDays();
  localStorage.removeItem('xjy_review');
  return {
    wId: w.id, cnId: cn.id,
    due, next, bumpForeign, nextFuture,
    foreignInQueue: due.indexOf(w.id) >= 0,
    cnInQueue: due.indexOf(cn.id) >= 0,
    foreignTouched: Object.prototype.hasOwnProperty.call(afterTouch, w.id),
  };
});
ok('C1 存量误入队的外国诗被 reviewDueList 过滤', beh.foreignInQueue === false, beh);
ok('C2 同期中文诗仍在队（不误伤）', beh.cnInQueue === true, beh);
ok('C3 nextDueDays 不计外国诗（外国诗 2 天 + 中文诗 5 天 → 只读到 5）', beh.nextFuture === 5, beh);
ok('C4 bumpReview(外国诗) = 0（不升桶）', beh.bumpForeign === 0, beh);
ok('C5 touchReview(外国诗) 不建档', beh.foreignTouched === false, beh);

/* ===== D. 源码结构：category 排除必须显式存在 ===== */
console.log('\n=== D. 源码结构 ===');
const src = await page.evaluate(() => reviewable.toString());
ok('D1 reviewable 本体含 category 外国诗判断', /外国诗/.test(src), src);
ok('D2 reviewable 本体仍保留 orig_lang 判断（旧能力不丢）', /orig_lang/.test(src), src);

await browser.close();
console.log(`\n════════ 汇总 ════════`);
console.log(`通过 ${pass} / 失败 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
