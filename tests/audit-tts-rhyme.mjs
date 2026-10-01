/* 全量语料审计：验证「麻韵证据排除斜」后，斜改写 12 → 10，且 2 处误伤已消除 */
import { chromium } from 'playwright-core';
import path from 'node:path';

const HTML = 'file:///D:/ZCode/小程序/xijiangyue/index.html';
const browser = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
const page = await browser.newPage();
await page.route('**/*', r => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
await page.goto(HTML, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

const res = await page.evaluate(() => {
  const out = { total: 0, changed: [], maPoems: 0 };
  for (const p of POEMS) {
    const lines = (p.lines || []).map(l => l.o);
    if (!lines.length) continue;
    const ma = poemRhymesMa(lines);
    if (ma) out.maPoems++;
    for (const l of lines) {
      out.total++;
      const f = ttsFix(l, ma);
      if (f !== l && /霞/.test(f) && /斜/.test(l)) {
        out.changed.push({ id: p.id, t: p.title, a: p.author, src: l, dst: f });
      }
    }
  }
  return out;
});

let pass = 0, fail = 0;
const ok = (c, name, extra = '') => { c ? pass++ : fail++; console.log(`${c ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`); };

console.log(`\n=== 全量语料：${res.total} 句，麻韵诗 ${res.maPoems} 首 ===`);
console.log(`斜→霞 改写 ${res.changed.length} 处\n`);

ok(res.changed.length === 10, 'C1 改写数收敛为 10（v2 复核为 12）', `实际 ${res.changed.length}`);

const ids = res.changed.map(c => c.id + '|' + c.t);
console.log(ids.map(x => '   · ' + x).join('\n'));

const bad1 = res.changed.find(c => /一枝霞/.test(c.dst));
const bad2 = res.changed.find(c => /雁行霞/.test(c.dst));
ok(!bad1, 'C2 《蓦山溪·洗妆真态》「竹外一枝斜」不再误改');
ok(!bad2, 'C3 《新水令》「风急雁行斜」不再误改');

// 反向确认：这 2 首现在 rhymeMa=false
const back = await page.evaluate(() => {
  // 按「句内容」定位，避免题名字段差异导致空命中（空命中会让断言假绿）
  const byLine = s => POEMS.find(p => (p.lines || []).some(l => (l.o || '').includes(s))) || null;
  const g = s => { const p = byLine(s); if (!p) return { title: 'NOT_FOUND:' + s, ma: null, hit: '' };
    const lines = (p.lines || []).map(l => l.o);
    return { title: p.title, ma: poemRhymesMa(lines), hit: (lines.find(l => /斜/.test(l)) || '') }; };
  return [g('竹外一枝斜'), g('风急雁行斜')];
});
for (const b of back) ok(b.ma === false && b.title && !b.title.startsWith('NOT_FOUND'),
  `C4 《${b.title}》rhymeMa=false`, b.hit);

// 正向确认：山行仍应改写（有独立麻韵证据「家」）
const shan = await page.evaluate(() => {
  const p = POEMS.find(x => (x.title || '').includes('山行'));
  const lines = (p.lines || []).map(l => l.o);
  return { ma: poemRhymesMa(lines), fix: lines.map(l => ttsFix(l, poemRhymesMa(lines))) };
});
ok(shan.ma === true, 'C5 《山行》rhymeMa 仍为 true（证据=家）');
ok(shan.fix.some(x => /石径霞/.test(x)), 'C6 《山行》「石径斜」仍叶韵为霞');

// 乌衣巷（斜在「斜照」行中 + 句末斜）
const wy = await page.evaluate(() => {
  const p = POEMS.find(x => (x.title || '').includes('乌衣巷'));
  const lines = (p.lines || []).map(l => l.o);
  const ma = poemRhymesMa(lines);
  return { ma, fix: lines.map(l => ttsFix(l, ma)), src: lines };
});
ok(wy.ma === true, 'C7 《乌衣巷》rhymeMa 仍为 true（证据=花/家）');
ok(wy.fix.join('').includes('霞'), 'C8 《乌衣巷》句末斜仍改写', wy.fix.join(' | '));

console.log(`\n════════ 通过 ${pass} / 失败 ${fail} ════════`);
await browser.close();
process.exit(fail ? 1 : 0);
