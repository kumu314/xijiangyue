// 小样自检 + 截图：三方案各截一张，并抓 pageerror
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
const F = 'file:///D:/ZCode/小程序/xijiangyue/out/r7-mockups/checkin-feedback-abc.html';
const OUT = 'D:/ZCode/小程序/xijiangyue/out/r7-mockups/';

(async () => {
  const ctx = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-mock', { channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 1080, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(F, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // 结构自检
  const chk = await page.evaluate(() => ({
    items: document.querySelectorAll('.ci-item').length,
    done: document.querySelectorAll('.ci-item.done').length,
    cnt: document.getElementById('cnt').textContent.trim(),
    scheme: document.body.dataset.scheme,
    notesTitle: document.querySelector('#notes h2')?.textContent.trim(),
    tlRows: document.querySelectorAll('#notes .tl dd').length,
    hasAudio: typeof ac === 'function' && typeof sndStamp === 'function',
  }));
  console.log('结构', JSON.stringify(chk));

  for (const s of ['A', 'B', 'C']) {
    await page.evaluate((s) => {
      document.querySelector(`.tab[data-s="${s}"]`).click();
      resetAll();
    }, s);
    await page.waitForTimeout(260);
    await page.screenshot({ path: OUT + `fb-scheme-${s}.png` });
    console.log('shot', s);
  }

  // 方案 B：点一项，抓动效中间帧（150ms）
  await page.evaluate(() => { document.querySelector('.tab[data-s="B"]').click(); resetAll(); });
  await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelectorAll('.ci-item')[3].click());
  await page.waitForTimeout(140);
  await page.screenshot({ path: OUT + 'fb-B-mid.png' });
  console.log('shot B-mid');

  // 方案 C：一键满勤
  await page.evaluate(() => { document.querySelector('.tab[data-s="C"]').click(); resetAll(); });
  await page.waitForTimeout(160);
  await page.evaluate(() => fillAll());
  await page.waitForTimeout(1400);
  const c = await page.evaluate(() => ({
    done: document.querySelectorAll('.ci-item.done').length,
    scrollOn: document.getElementById('scroll').classList.contains('on'),
    coda: document.getElementById('scrollText').textContent.trim(),
    enc: document.getElementById('enc').textContent.trim(),
  }));
  console.log('满勤', JSON.stringify(c));
  await page.screenshot({ path: OUT + 'fb-C-full.png' });
  console.log('shot C-full');

  // reduced-motion 降级
  await page.evaluate(() => { document.getElementById('rm').checked = true; resetAll(); });
  await page.evaluate(() => document.querySelectorAll('.ci-item')[3].click());
  await page.waitForTimeout(200);
  const rmInfo = await page.evaluate(() => ({
    sparks: document.querySelectorAll('.spark').length,
    done: document.querySelectorAll('.ci-item.done').length,
    cnt: document.getElementById('cnt').textContent.trim(),
  }));
  console.log('reduce态', JSON.stringify(rmInfo));

  console.log('pageerrors', JSON.stringify(errs.slice(0, 4)));
  await ctx.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
