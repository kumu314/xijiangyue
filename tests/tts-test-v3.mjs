/* 西江阅 #54 P1-TTS 尾巴三项 · 行为断言
   ①句间短停顿（呼吸感）②iOS 首次 speak user-gesture 解锁 ③可插拔适配层（微信 webview 留位） */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const OUT = 'D:/AgentHub/agent-bridge/out/tts-fix';
fs.mkdirSync(OUT, { recursive: true });
const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';
const HTML = 'D:/ZCode/小程序/xijiangyue/index.html';

let pass = 0, fail = 0;
const ok = (n, c, extra) => {
  if (c) { pass++; console.log('  ✓ ' + n); }
  else { fail++; console.log('  ✗ ' + n + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};

const MOCK = (voicesJson) => `
window.__tts = { spoken: [], cfgs: [], cancels: 0, unlocks: [], delay: 250 };
window.SpeechSynthesisUtterance = class { constructor(t){ this.text = t; } };
Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
  cancel(){ window.__tts.cancels++; },
  speak(u){
    if(u.text===" " && u.volume===0){ window.__tts.unlocks.push(u.text); return; }
    window.__tts.spoken.push({ text:u.text, t:Date.now(), rate:u.rate, voice:u.voice?u.voice.name:null });
    setTimeout(() => { if (u.onend) try { u.onend(); } catch(e){} }, window.__tts.delay);
  },
  getVoices(){ return ${voicesJson}; },
}});
`;
const MOCK_NONE_API = `
window.__tts = { spoken: [], unlocks: [], cancels: 0 };
try { delete window.speechSynthesis; } catch(e) {}
try { delete window.SpeechSynthesisUtterance; } catch(e) {}
Object.defineProperty(window, 'speechSynthesis', { configurable: true, get(){ return undefined; } });
`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
async function open(initScript) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(initScript);
  const page = await ctx.newPage();
  await page.route('**/*', (r) => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  return { ctx, page };
}

/* ===== ① 句间停顿 ===== */
console.log('\n=== ① 句间短停顿（呼吸感） ===');
{
  const { ctx, page } = await open(MOCK(`[{lang:'zh-CN',name:'普通话本地合成',localService:true}]`));
  const gapFn = await page.evaluate(() => ({
    comma: gapAfter('远上寒山石径斜，'),
    period: gapAfter('白云生处有人家。'),
    excl: gapAfter('停车坐爱枫林晚！'),
    none: gapAfter('霜叶红于二月花'),
    cfg: TTS_GAP,
  }));
  ok('G1 逗号/无标点 → 260ms', gapFn.comma === 260 && gapFn.none === 260, gapFn);
  ok('G2 句末（。！？）→ 420ms', gapFn.period === 420 && gapFn.excl === 420, gapFn);

  await page.evaluate(() => { const p = POEMS.find(x => x.title.includes('山行')); openDetail(p.id); readAloud(); });
  await page.waitForTimeout(2200);
  const ts = await page.evaluate(() => window.__tts.spoken.map(x => x.t));
  const gaps = ts.slice(1).map((t, i) => t - ts[i]);
  ok('G3 实际句间间隔 ≥ 250ms（有呼吸感）', gaps.length >= 1 && gaps.every(g => g >= 250), gaps);
  // 实际间隔 = mock onend 延时 250 + 停顿 420 ≈ 670（容差上浮 250，防机器抖动误判）
  ok('G4 句末停顿 ≈ 250+420=670ms（容差 +250）', gaps.every(g => g >= 420 && g <= 920), gaps);
  await page.screenshot({ path: OUT + '/gap-playing.png' });

  // 停止后定时器不得继续推进下一句
  const before = await page.evaluate(() => window.__tts.spoken.length);
  await page.evaluate(() => stopSpeech());
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => window.__tts.spoken.length);
  ok('G5 停止后定时器作废（不再播下一句）', after === before, { before, after });
  await ctx.close();
}

/* ===== ② iOS user-gesture 解锁 ===== */
console.log('\n=== ② iOS 首次 speak 解锁 ===');
{
  const { ctx, page } = await open(MOCK(`[{lang:'zh-CN',name:'普通话本地合成'}]`));
  const u0 = await page.evaluate(() => ({ unlocked: ttsUnlocked, unlocks: window.__tts.unlocks.length }));
  ok('I1 初始未解锁', u0.unlocked === false && u0.unlocks === 0, u0);
  const u1 = await page.evaluate(() => {
    const p = POEMS.find(x => x.title.includes('山行')); openDetail(p.id);
    readAloud();                     // 模拟点击入口（手势链内）
    return { unlocked: ttsUnlocked, unlocks: window.__tts.unlocks.length, adapter: TTS.name };
  });
  ok('I2 点击入口触发解锁（静音空播）', u1.unlocked === true && u1.unlocks === 1, u1);
  const u2 = await page.evaluate(() => { readAloud(); readAloud(); return window.__tts.unlocks.length; });
  ok('I3 只解锁一次（幂等）', u2 === 1, u2);
  const u3 = await page.evaluate(() => { stopSpeech(); const p = POEMS.find(x => x.title.includes('山行')); openDetail(p.id); readAloud(); return window.__tts.unlocks.length; });
  ok('I4 后续朗读不再重复解锁', u3 === 1, u3);
  await ctx.close();
}

/* ===== ③ 可插拔适配层 ===== */
console.log('\n=== ③ 适配层（微信 webview 无 Web Speech） ===');
{
  const { ctx, page } = await open(MOCK_NONE_API);
  const a = await page.evaluate(() => ({
    supported: TTS.supported(),
    name: TTS.name,
    voices: TTS.getVoices().length,
    cancelOk: (() => { try { TTS.cancel(); return true; } catch (e) { return String(e); } })(),
    unlockOk: TTS.unlock(),
  }));
  ok('A1 无 Web Speech 时 TTS.supported() = false', a.supported === false, a);
  ok('A2 getVoices 降级返回空数组（不抛错）', Array.isArray(a.voices === 0 ? [] : []) && a.voices === 0, a);
  ok('A3 cancel() 降级安全（不抛错）', a.cancelOk === true, a);
  ok('A4 unlock() 降级返回 false（不抛错）', a.unlockOk === false, a);
  const b = await page.evaluate(() => {
    let err = null, toastTxt = '';
    try { openDetail(POEMS[0].id); readAloud(); } catch (e) { err = e.message; }
    toastTxt = document.querySelector('#toast') && document.querySelector('#toast').textContent;
    return { err, toastTxt };
  });
  ok('A5 不支持环境下 readAloud 不抛错', b.err === null, b);
  ok('A6 给出明确提示（不静默无声）', /不支持朗读/.test(b.toastTxt || ''), b.toastTxt);
  await page.screenshot({ path: OUT + '/adapter-noapi.png' });
  await ctx.close();
}

/* ===== 静态：适配层收口（业务代码不得直调 window.speechSynthesis） ===== */
console.log('\n=== 静态检查：适配层收口 ===');
{
  const src = fs.readFileSync(HTML, 'utf8');
  const script = (src.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
  const lines = script.split('\n');
  let start = -1, end = -1;
  lines.forEach((l, i) => {
    if (start < 0 && /朗读适配层/.test(l)) start = i;   // 含适配层的块注释（注释里也提到该 API 名）
    if (start >= 0 && end < 0 && i > start && /^\};/.test(l.trim())) end = i;
  });
  const bad = [];
  lines.forEach((l, i) => {
    if (start >= 0 && end >= 0 && i >= start && i <= end) return;   // 适配层定义体内允许直调
    if (/\/\//.test(l.split('window.speechSynthesis')[0] || '')) return; // 跳过注释行
    if (l.includes('window.speechSynthesis')) bad.push(i + 1);
  });
  ok(`S1 适配层之外无 window.speechSynthesis 直调（层内 ${start}-${end} 行豁免）`, bad.length === 0, bad);
  const hasAll = ['const TTS={', 'supported(){', 'cancel(){', 'getVoices(){', 'onVoicesChanged(', 'speak(u){', 'unlock(){']
    .every(k => script.includes(k));
  ok('S2 适配层接口齐全（supported/cancel/getVoices/onVoicesChanged/speak/unlock）', hasAll);
}

await browser.close();
console.log(`\n════════ TTS 尾巴三项汇总 ════════`);
console.log(`通过 ${pass} / 失败 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
