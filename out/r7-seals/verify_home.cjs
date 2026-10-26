// #199 P0-1 换印后真页截图自检：home / learn / detail(将进酒) + 印章计数
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--force-device-scale-factor=2'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'D:/ZCode/小程序/xijiangyue/out/r7-seals/after-home.png' });
  // 学习页（打卡印 + 印谱）
  await page.click('#tabbar .tb:nth-child(2)');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'D:/ZCode/小程序/xijiangyue/out/r7-seals/after-learn.png' });
  // 详情页（题签印 + hero 印）
  await page.click('#tabbar .tb:nth-child(1)');
  await page.waitForTimeout(300);
  await page.evaluate(() => openDetail(POEMS[0].id));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'D:/ZCode/小程序/xijiangyue/out/r7-seals/after-detail.png' });
  // 机械核验：印章 svg 数 + 残留纯文字印 + 符号缺失
  const audit = await page.evaluate(() => {
    const svgs = document.querySelectorAll('svg.sealsvg').length;
    const useMissing = [...document.querySelectorAll('svg.sealsvg use')].filter(u => {
      const h = u.getAttribute('href') || '';
      return h.startsWith('#seal-') && !document.querySelector(h);
    }).length;
    // 容器里还直接放印文字的（漏换）
    const plain = [...document.querySelectorAll('.seal,.stamp,.jl-seal,.gc-seal,.lg-logo')]
      .filter(el => el.textContent.trim() && !el.querySelector('svg.sealsvg')).map(el => el.className + ':' + el.textContent.trim());
    return { svgs, useMissing, plain, POEMS: POEMS.length };
  });
  console.log('AUDIT', JSON.stringify(audit), 'pageerrors', JSON.stringify(errs));
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
