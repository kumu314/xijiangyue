/* #279 ⑧ 竖排诗句不全 —— 裁字复现（#279 诊断用，只读）
   ─────────────────────────────────────────────────────────────
   判据：每列字数 × 实测行高 ≤ 容器可用高（.vbody.clientHeight - padding）
   为什么不用 offsetHeight：.vline 高度被容器钳死为 288px，
     内容溢出时 offsetHeight 仍是 288，看不出来。必须用「内容需要的高度」比。

   跑法：node out/review-tools/diag-vertical-clip.mjs
        （需在 tests/ 下跑，或把本文件复制到 tests/ 以解析 playwright-core）
   期望：12/16 组合报「✗ 裁字」= 已复现；修好后应为 0/16。
*/
process.env.TMPDIR = process.env.TMPDIR || 'D:/AgentHub/tmp';
process.env.TEMP = process.env.TEMP || 'D:/AgentHub/tmp';
process.env.TMP = process.env.TMP || 'D:/AgentHub/tmp';

import { chromium } from 'playwright-core';

const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';
const PROFILE = 'D:/AgentHub/tmp/chrome-diag279';
const TITLES = ['夜雨寄北', '春晓', '静夜思', '登鹳雀楼'];
const SIZES = ['小', '中', '大', '特大'];

const browser = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto(URL_, { waitUntil: 'load' });
await page.waitForTimeout(1000);

let bad = 0, tot = 0;
const table = [];

for (const size of SIZES) {
  for (const t of TITLES) {
    const r = await page.evaluate(({ title, size }) => {
      const p = POEMS.find(x => (x.title || '').includes(title));
      if (!p) return null;
      setFont('size', size); setLayout('vertical'); openDetail(p.id);
      const body = document.querySelector('.vbody');
      const els = [...body.querySelectorAll('.vline')];
      const cs = els[0] ? getComputedStyle(els[0]) : null;
      const lhPx = cs ? parseFloat(cs.lineHeight) : 0;
      const avail = body.clientHeight - 12;   // padding 6px × 2
      return {
        title, lhPx, avail,
        cols: els.map(e => {
          const n = [...e.textContent].length;
          return { li: e.dataset.li, chars: n, need: Math.round(n * lhPx) };
        }),
      };
    }, { title: t, size });

    if (!r) { console.log(`SKIP ${t}（POEMS 未找到）`); continue; }
    const over = r.cols.filter(c => c.need > r.avail + 1);
    const cap = Math.floor(r.avail / r.lhPx);
    const lost = over.reduce((a, c) => a + Math.max(0, c.chars - cap), 0);
    tot++;
    if (over.length) bad++;
    table.push({ size, title: t, lh: r.lhPx, cap, segs: r.cols.length, over: over.length, lost });
    const tag = over.length ? `✗ 裁 ${lost} 字` : '✓';
    console.log(` ${size.padEnd(2)} ${t.padEnd(5)} 行高${r.lhPx}px 容量${cap}字 段数${r.cols.length}  ${tag}`);
  }
}

console.log(`\n=== ${bad}/${tot} 组合存在裁字 ===`);
if (errs.length) console.log('pageerror:', errs.slice(0, 3));
console.log(bad === 0 ? 'PASS：竖排无裁字' : 'FAIL：竖排存在裁字');

await browser.close();
process.exit(bad === 0 ? 0 : 1);
