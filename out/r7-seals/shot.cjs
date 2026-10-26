// #199 P0-1 探针截图
const { createRequire } = require('module');
const req = createRequire('D:/ZCode/小程序/xijiangyue/tests/node_modules/x');
const { chromium } = req('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--force-device-scale-factor=3'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.goto('file:///D:/ZCode/小程序/xijiangyue/out/r7-seals/probe.html');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'D:/ZCode/小程序/xijiangyue/out/r7-seals/probe-full.png', fullPage: true });
  await browser.close();
  console.log('PROBE-SHOT-OK');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
