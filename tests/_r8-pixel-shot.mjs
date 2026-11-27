/* 临时取证脚本（不入库）：截取 hero 听朗读按钮的「正常」与「同位置空白背景」两张同尺寸图，
   供 D:/tmp/r8-pixel-aa.py 做像素级 WCAG 取样。 */
process.env.TMPDIR = 'D:/AgentHub/tmp';
process.env.TEMP = 'D:/AgentHub/tmp';
process.env.TMP = 'D:/AgentHub/tmp';
import { chromium } from 'playwright-core';
const browser = await chromium.launchPersistentContext('D:/AgentHub/tmp/chrome-r8-pixel', {
  channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 },
});
const page = await browser.newPage();
await page.goto('file:///D:/ZCode/小程序/xijiangyue/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('xjy_layout', 'vertical'); });
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(500);
const rect = await page.evaluate(() => {
  const r = document.querySelector('.hero .btn-quiet').getBoundingClientRect();
  return { x: Math.floor(r.left), y: Math.floor(r.top), width: Math.ceil(r.width), height: Math.ceil(r.height) };
});
const clip = { x: rect.x - 4, y: rect.y - 4, width: rect.width + 8, height: rect.height + 8 };
await page.screenshot({ path: 'D:/tmp/r8-quiet-normal.png', clip });
await page.addStyleTag({ content: '.hero .btn-quiet{color:transparent !important}.hero .btn-quiet svg{visibility:hidden !important}' });
await page.waitForTimeout(120);
await page.screenshot({ path: 'D:/tmp/r8-quiet-bg.png', clip });
console.log(JSON.stringify({ rect, clip }));
await browser.close();
