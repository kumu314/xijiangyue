// 真实产品截图：打卡完成反馈（落印中 / 已完成 / 满勤卷 / reduce）
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const OUT = 'D:/ZCode/小程序/xijiangyue/out/r7-seals/';
const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';

(async () => {
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r7-fb', { channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.evaluate(() => { showView('view-learn'); renderLearn(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + 'fb-0-before.png', clip: { x: 0, y: 0, width: 390, height: 620 } });

  // 落印中间帧
  await page.evaluate(() => document.querySelector('.ci-item[data-k="read"]').click());
  await page.waitForTimeout(110);
  await page.screenshot({ path: OUT + 'fb-1-mid.png', clip: { x: 0, y: 0, width: 390, height: 620 } });
  await page.waitForTimeout(600);

  // 完成两项后的稳态（常驻朱印 + 淡墨底 + 计数）
  await page.evaluate(() => document.querySelector('.ci-item[data-k="know"]').click());
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT + 'fb-2-two-done.png', clip: { x: 0, y: 0, width: 390, height: 620 } });

  // 剩一项：Zeigarnik 朱色提示
  await page.evaluate(() => { ['watch', 'memory'].forEach(k => document.querySelector(`.ci-item[data-k="${k}"]`).click()); });
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT + 'fb-3-last-one.png', clip: { x: 0, y: 0, width: 390, height: 660 } });

  // 满勤卷
  await page.evaluate(() => document.querySelector('.ci-item[data-k="review"]').click());
  await page.waitForTimeout(900);
  const full = await page.evaluate(() => ({
    done: document.querySelectorAll('.ci-item.done').length,
    on: document.getElementById('ciScroll')?.classList.contains('on'),
    text: document.querySelector('#ciScroll .bt')?.textContent.trim(),
    h: Math.round(document.getElementById('ciScroll').getBoundingClientRect().height),
  }));
  console.log('满勤', JSON.stringify(full));
  await page.screenshot({ path: OUT + 'fb-4-full.png', clip: { x: 0, y: 0, width: 390, height: 720 } });

  // reduce 态
  const p2 = await ctx.newPage();
  await p2.emulateMedia({ reducedMotion: 'reduce' });
  await p2.setViewportSize({ width: 390, height: 900 });
  await p2.goto(URL_, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(600);
  await p2.evaluate(() => localStorage.clear());
  await p2.reload({ waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(600);
  await p2.evaluate(() => { showView('view-learn'); renderLearn(); document.querySelector('.ci-item[data-k="read"]').click(); });
  await p2.waitForTimeout(400);
  await p2.screenshot({ path: OUT + 'fb-5-reduce.png', clip: { x: 0, y: 0, width: 390, height: 620 } });

  await ctx.close();
  console.log('done');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
