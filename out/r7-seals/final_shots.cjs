// round7 收尾视觉复验：首页 / 详情竖排 / 学习页 / 浓档对比 / reduce 态
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const OUT = 'D:/ZCode/小程序/xijiangyue/out/r7-seals/';
const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';

(async () => {
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r7-shot', { channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const shot = async (name) => { await page.waitForTimeout(280); await page.screenshot({ path: OUT + name }); console.log('shot', name); };

  // ① 首页（淡档，默认）
  await page.evaluate(() => { showView('view-home'); });
  await shot('final-home-light.png');

  // ② 首页浓档（看纸纹是否只在纸面、没压 hero）
  await page.evaluate(() => setPaper('heavy'));
  await shot('final-home-heavy.png');

  // ③ 详情竖排·特大·浓档（看折行分组 + 题签印残边）
  await page.evaluate(() => {
    setPaper('light');
    setFont('size', '特大');
    const p = POEMS.find(x => { const L = (x.lines || []).map(l => [...(l.o || '')].length); return L.length >= 4 && L.some(y => y >= 16); });
    openDetail(p.id);
  });
  await shot('final-detail-vcont-max.png');

  // ④ 学习页打卡（全部完成 → 6 枚印齐现）
  await page.evaluate(() => {
    setFont('size', '中');
    showView('view-learn');
    CHECKIN_ITEMS.forEach(it => toggleCheckin(it.key));
  });
  await shot('final-learn-done.png');

  // ⑤ reduce 态首页（应无动效，视觉与常态一致）
  const p2 = await ctx.newPage();
  await p2.emulateMedia({ reducedMotion: 'reduce' });
  await p2.setViewportSize({ width: 390, height: 844 });
  await p2.goto(URL_, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(600);
  await p2.evaluate(() => { localStorage.clear(); });
  await p2.reload({ waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(600);
  await p2.evaluate(() => showView('view-home'));
  await p2.waitForTimeout(300);
  await p2.screenshot({ path: OUT + 'final-home-reduce.png' });
  console.log('shot final-home-reduce.png');

  await ctx.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
