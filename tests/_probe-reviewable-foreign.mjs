/* 探针：web reviewable 对 category==='外国诗' 的漏挡实测（只读，不改产品） */
process.env.TMPDIR = process.env.TMPDIR || 'D:/AgentHub/tmp';
process.env.TEMP = process.env.TEMP || 'D:/AgentHub/tmp';
process.env.TMP = process.env.TMP || 'D:/AgentHub/tmp';
import { chromium } from 'playwright-core';
const PROFILE = 'D:/AgentHub/tmp/chrome-r8-test';
const URL_ = process.env.TEST_HTML || 'file:///D:/ZCode/小程序/xijiangyue/index.html';
const browser = await chromium.launchPersistentContext(PROFILE, {
  channel: 'chrome', args: ['--no-sandbox'], viewport: { width: 390, height: 844 },
});
const page = await browser.newPage();
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
const r = await page.evaluate(() => {
  const foreign = POEMS.filter(p => p.category === '外国诗');
  const missingLang = foreign.filter(p => !p.orig_lang);
  const zhLang = foreign.filter(p => p.orig_lang === 'zh');
  const otherLang = foreign.filter(p => p.orig_lang && p.orig_lang !== 'zh');
  const leaked = foreign.filter(p => reviewable(p));  // 当前 reviewable 会放行的外国诗
  const nonForeignBadLang = POEMS.filter(p => p.category !== '外国诗' && p.orig_lang && p.orig_lang !== 'zh');
  return {
    total: POEMS.length,
    foreignN: foreign.length,
    missingLangN: missingLang.length,
    zhLangN: zhLang.length,
    otherLangN: otherLang.length,
    leakedN: leaked.length,
    leakedIds: leaked.map(p => p.id),
    nonForeignBadLangN: nonForeignBadLang.length,
    sample: foreign.slice(0, 4).map(p => ({ id: p.id, category: p.category, orig_lang: p.orig_lang, reviewable: reviewable(p) })),
  };
});
console.log(JSON.stringify(r, null, 2));
await browser.close();
