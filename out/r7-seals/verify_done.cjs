// #199 P0-1 打卡完成态 + 印谱 + 落印动效首帧 截图
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--force-device-scale-factor=2'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html');
  await page.waitForTimeout(400);
  // 预置：今日五项完成 + 印谱 8 印（走产品自身的数据结构）
  await page.evaluate(() => {
    const d = new Date();
    const t = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    localStorage.setItem('shiyun_checkin', JSON.stringify({ date: t, done: { read: 1, watch: 1, know: 1, memory: 1, review: 1 } }));
    const alb = [];
    for (let i = 8; i > 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); alb.push({ date: x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0') }); }
    localStorage.setItem('shiyun_album', JSON.stringify(alb));
  });
  await page.reload();
  await page.waitForTimeout(500);
  await page.click('#tabbar .tb:nth-child(2)');
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'D:/ZCode/小程序/xijiangyue/out/r7-seals/after-learn-done.png', fullPage: true });
  const audit = await page.evaluate(() => ({
    stamps: document.querySelectorAll('.ci-item .stamp svg.sealsvg').length,
    stampIn: document.querySelectorAll('.stamp.stamp-in').length,
    albumSeals: document.querySelectorAll('.ci-album .seal svg.sealsvg').length,
    albumPlain: [...document.querySelectorAll('.ci-album .seal')].filter(el => el.textContent.trim() && !el.querySelector('svg.sealsvg')).length,
  }));
  console.log('AUDIT', JSON.stringify(audit));
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
