// 验证 out/viz-aa-preview-20261126.html 真实渲染：卡片数 / 读数文本 / 控制台错误
import { chromium } from 'playwright-core';

const url = 'file:///D:/ZCode/小程序/xijiangyue/out/viz-aa-preview-20261126.html';
const browser = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r8-pixel', {
  channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 1000, height: 900 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(400);

const cells = await page.locator('.cell').count();
const gate = (await page.locator('#gate').innerText()).replace(/\s+/g, ' ').trim();
const ratios = await page.locator('.meta .r').allInnerTexts();
const capSizes = await page.$$eval('.cap', els => els.map(e => getComputedStyle(e).fontSize));
const capColors = await page.$$eval('.cap', els => els.map(e => getComputedStyle(e).color));

console.log('cells =', cells);
console.log('gate  =', gate);
console.log('ratios=', ratios.join(' '));
console.log('cap fontSize uniq =', [...new Set(capSizes)].join(','));
console.log('cap color uniq    =', [...new Set(capColors)].join(','));
console.log('errors =', errs.length ? errs.join(' | ') : 'none');

const ok = cells === 10
  && /0\/10/.test(gate)
  && new Set(capSizes).size === 1 && capSizes[0] === '13px'
  && errs.length === 0;
console.log(ok ? 'RESULT=PASS' : 'RESULT=FAIL');
await browser.close();
process.exit(ok ? 0 : 1);
