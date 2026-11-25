/* 西江阅 round8 极简正向优化 P1 · 行为断言（#342）
   ─────────────────────────────────────────────────────────────
   判据范围：
     §A P1-1 详情页标签条 v2（六项全留，次级四枚 11px/400/ink-3，分隔线一枚）
     §B P1-2 首页 hero 动作区 v2（ghost 降权：去框 / 12.5px / 保「听朗读」文字；
        颜色由小样的 ink-3 上提为 ink-2 —— 真实 hero 有 15% 意象底，ink-3 像素实测 4.04 AA 未过 4.5，
        枯木 2026-11-26 拍板改 ink-2，像素实测 5.4 / 最暗 4.78 AA）
     §C 硬验收门（排版矩阵 375/390/428 × 字号档极值 × 竖/横排无破版；
                  朱砂主按钮不回退、题签与印章不回退、零 emoji、无 pageerror）

   跑法：node tests/r8-minimal-test.mjs
   反向注入：TEST_HTML=<故意破坏的副本绝对路径> node tests/r8-minimal-test.mjs
             TEST_HTML 只为证明判据仍会红，正常验收绝不设它。

   启动方式复用 r7-texture-test.mjs：launchPersistentContext + profile/TMP 落 D 盘
   （本机 C 盘紧张，chromium.launch() 会被 SIGTERM 连杀）。
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

/* WCAG 2.1 相对亮度；此处是「令牌/端点查表复算」，不是像素取样。
   像素取样由独立验收步骤做，两者口径不同不可互相替代。 */
function ratio(hex1, hex2) {
  const lum = (hex) => {
    const c = hex.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255)
      .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const a = lum(hex1), b = lum(hex2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const browser = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 },
});

async function fresh(seed) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('dialog', d => d.dismiss());
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate((s) => {
    localStorage.clear();
    Object.entries(s || {}).forEach(([k, v]) => localStorage.setItem(k, v));
  }, seed || null);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(350);
  page._errs = errs;
  return page;
}

console.log('被测：' + URL_ + (TEST_HTML ? '   ← TEST_HTML 指定，非产品文件！' : ''));

/* ══════════════ §A / §B 结构 + 样式 ══════════════ */
{
  const page = await fresh({ xjy_layout: 'vertical' });
  const s = await page.evaluate(() => {
    const h = document.querySelector('.hero');
    if (!h) return null;
    const a = h.querySelector('.actions');
    const p = a && a.querySelector('.btn-primary');
    const q = a && a.querySelector('.btn-quiet');
    const qcs = q ? getComputedStyle(q) : null;
    const tabs = document.querySelector('#dTabs');
    return {
      heroChildren: [...h.children].map(e => e.className || e.tagName.toLowerCase()),
      hasTag: !!h.querySelector('.tag'),
      hasSeal: !!h.querySelector('.seal'),
      actions: a ? a.querySelectorAll('button').length : -1,
      primaryText: p ? p.innerText.trim() : '',
      primaryBg: p ? getComputedStyle(p).backgroundColor : '',
      quietText: q ? q.innerText.trim() : '',
      quietBorder: qcs ? qcs.borderStyle : '',
      quietSize: qcs ? qcs.fontSize : '',
      quietWeight: qcs ? qcs.fontWeight : '',
      quietColor: qcs ? qcs.color : '',
      quietSvg: !!(q && q.querySelector('svg')),
      quietOnclick: q ? (q.getAttribute('onclick') || '') : '',
      nIcon: a ? a.querySelectorAll('.btn-icon').length : -1,
      nGhost: a ? a.querySelectorAll('.btn-ghost').length : -1,
      tabLabels: tabs ? [...tabs.querySelectorAll('.tab')].map(t => t.textContent.trim()) : [],
      nSep: tabs ? tabs.querySelectorAll('.sep').length : -1,
      demoted: tabs ? [...tabs.querySelectorAll('.tab.demoted')].map(t => {
        const cs = getComputedStyle(t);
        return { label: t.textContent.trim(), size: cs.fontSize, weight: cs.fontWeight, color: cs.color };
      }) : [],
      emoji: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(
        (h.innerText || '') + (tabs ? tabs.innerText || '' : ''))
    };
  });

  console.log('\n§A P1-1 标签条 v2 / §B P1-2 hero 动作区 v2');
  ok('首页 hero 存在且八块结构未增删', !!s && s.heroChildren.length === 8, s && s.heroChildren);
  ok('题签与印章保留（仪式层未回退）', !!s && s.hasTag && s.hasSeal, s && { tag: s.hasTag, seal: s.hasSeal });
  ok('hero 动作目标数 = 2（减呈现不减功能）', !!s && s.actions === 2, s && s.actions);
  ok('主按钮「开始学习 →」朱砂底未回退', !!s && s.primaryText.includes('开始学习') && s.primaryBg === 'rgb(178, 58, 46)',
     s && { text: s.primaryText, bg: s.primaryBg });

  ok('听朗读文字保留（v2 不隐藏功能名）', !!s && s.quietText.includes('听朗读'), s && s.quietText);
  ok('听朗读去框（border-style: none）', !!s && s.quietBorder === 'none', s && s.quietBorder);
  ok('听朗读降号 12.5px', !!s && s.quietSize === '12.5px', s && s.quietSize);
  ok('听朗读降色 ink-2（rgb(92, 82, 70)；ink-3 像素实测 4.04 AA 不达标）',
     !!s && s.quietColor === 'rgb(92, 82, 70)', s && s.quietColor);
  ok('听朗读字重 500（低于主按钮 600）', !!s && s.quietWeight === '500', s && s.quietWeight);
  ok('喇叭图标仍在（文字+图标双线索）', !!s && s.quietSvg, s && s.quietSvg);
  ok('onclick=readPoem 未变（功能未删）', !!s && s.quietOnclick.includes('readPoem'), s && s.quietOnclick);
  ok('v1 图标位已撤（.btn-icon = 0）', !!s && s.nIcon === 0, s && s.nIcon);
  ok('现状描边 ghost 已撤（.btn-ghost = 0）', !!s && s.nGhost === 0, s && s.nGhost);

  ok('详情页标签六项全在且顺序不变', !!s && JSON.stringify(s.tabLabels) ===
     JSON.stringify(['解读', '记忆', '串讲', '动画', '场景', '背景']), s && s.tabLabels);
  ok('主次分隔线恰好一枚', !!s && s.nSep === 1, s && s.nSep);
  ok('次级四枚 11px/400/ink-3', !!s && s.demoted.length === 4 && s.demoted.every(d =>
     d.size === '11px' && d.weight === '400' && d.color === 'rgb(110, 98, 72)'), s && s.demoted);

  const rCard = ratio('#5C5246', '#FBF6EA');
  const rDark = ratio('#5C5246', '#D6CBBE'); // 像素取样测到的 hero 意象底最暗处
  ok('对比度查表：ink-2 / paper-card = 7.08 AA；意象底最暗 #D6CBBE 复算 4.78 AA',
     rCard.toFixed(2) === '7.08' && rDark >= 4.5,
     { paperCard: +rCard.toFixed(2), heroDarkest: +rDark.toFixed(2) });
  ok('零 emoji（hero + 标签条可见文本）', !!s && !s.emoji, s && s.emoji);
  ok('§A/§B 无 pageerror', page._errs.length === 0, page._errs.slice(0, 2));
  await page.close();
}

/* ══════════════ §C 排版矩阵 ══════════════ */
console.log('\n§C 排版矩阵 375/390/428 × 字号档极值 × 竖/横排');
{
  const page = await fresh(null);
  for (const width of [375, 390, 428]) {
    for (const layout of ['vertical', 'horizontal']) {
      for (const size of ['小', '特大']) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(({ layout, size }) => {
          localStorage.setItem('xjy_layout', layout);
          localStorage.setItem('xjy_font', JSON.stringify({ size }));
        }, { layout, size });
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(200);
        const m = await page.evaluate(() => {
          const h = document.querySelector('.hero'), a = h && h.querySelector('.actions');
          if (!h || !a) return null;
          const hr = h.getBoundingClientRect(), ar = a.getBoundingClientRect();
          const q = a.querySelector('.btn-quiet'), p = a.querySelector('.btn-primary');
          const qr = q && q.getBoundingClientRect(), pr = p && p.getBoundingClientRect();
          return {
            heroLeft: hr.left, heroRight: hr.right, width: innerWidth,
            overflow: a.scrollWidth - a.clientWidth,
            primaryIn: !!pr && pr.left >= hr.left - 1 && pr.right <= hr.right + 1,
            quietIn: !!qr && qr.left >= hr.left - 1 && qr.right <= hr.right + 1,
            quietVisible: !!(q && q.innerText.includes('听朗读') && qr.width > 40 && qr.height > 20),
            overlap: !!(qr && pr && qr.left < pr.right && pr.left < qr.right),
          };
        });
        const label = `${width}px × ${layout} × ${size}`;
        ok(label + ' 无破版（动作区不溢出/不越界/不重叠/文字在）',
           !!m && m.heroLeft >= -1 && m.heroRight <= m.width + 1 && m.overflow <= 1 &&
           m.primaryIn && m.quietIn && m.quietVisible && !m.overlap, m);
      }
    }
  }
  ok('§C 无 pageerror', page._errs.length === 0, page._errs.slice(0, 2));
  await page.close();
}

await browser.close();
console.log('\n结果：PASS ' + pass + ' / FAIL ' + fail + '（FAIL=0 为过）');
process.exit(fail === 0 ? 0 : 1);
