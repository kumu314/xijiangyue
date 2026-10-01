/* 西江阅 #58 打回项（破音字表返工 + 音色优选 + 朗读设置）· 行为断言
   mock window.speechSynthesis（Chrome 原型只读 accessor，必须 defineProperty 遮蔽）。
   截图 out/tts-fix/（png 不入库）。 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const OUT = 'D:/AgentHub/agent-bridge/out/tts-fix';
fs.mkdirSync(OUT, { recursive: true });
const URL_ = 'file:///D:/ZCode/小程序/xijiangyue/index.html';

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};

const MOCK_HEAD = (voicesJson) => `
window.__tts = { spoken: [], cfgs: [], cancels: 0, unlocks: [], delay: 250 };
window.SpeechSynthesisUtterance = class { constructor(t){ this.text = t; } };
Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
  cancel(){ window.__tts.cancels++; },
  speak(u){
    if(u.text===" " && u.volume===0){ window.__tts.unlocks.push(u.text); return; }  /* iOS 解锁用的静音空播，不计入朗读序列 */
    window.__tts.spoken.push({ text:u.text, t:Date.now() });
    window.__tts.cfgs.push({ rate: u.rate, lang: u.lang, voice: u.voice ? u.voice.name : null });
    setTimeout(() => { if (u.onend) try { u.onend(); } catch(e){} }, window.__tts.delay);
  },
  getVoices(){ return ${voicesJson}; },
}});
`;

const V_NONE = '[]';
const V_MULTI = `[
  { lang:'zh-TW', name:'Mei-Jia (Taiwan)' },
  { lang:'yue-HK', name:'Sin-Ji (Cantonese)' },
  { lang:'zh-CN', name:'Yaoyao Online' },
  { lang:'zh-CN', name:'普通话本地合成', localService:true },
  { lang:'zh-CN', name:'Xiaoxiao Online' }
]`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
async function open(voicesJson) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(MOCK_HEAD(voicesJson));
  const page = await ctx.newPage();
  await page.route('**/*', (r) => r.request().url().startsWith('file://') ? r.continue() : r.abort());
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  return { ctx, page };
}

/* ============ 轮次：分段队列/循环/cancel/按钮/toast（既有口径回归） ============ */
async function runRound(tag, voicesJson) {
  console.log(`\n=== ${tag} ===`);
  const { ctx, page } = await open(voicesJson);
  const shanxingId = await page.evaluate(() => { const p = POEMS.find(x => x.title.includes('山行')); return p && p.id; });
  ok('A0 找到测试诗「山行」', !!shanxingId, shanxingId);
  await page.evaluate((id) => openDetail(id), shanxingId);
  await page.waitForTimeout(400);
  const lineCount = await page.evaluate((id) => POEMS.find(x => x.id === id).lines.length, shanxingId);
  const vlineCount = await page.locator('.vline').count();
  ok('A1 详情页竖排行数 = 数据行数', vlineCount === lineCount, { vlineCount, lineCount });

  await page.locator('#view-detail .read-btn').first().click();
  await page.waitForTimeout(100);
  ok('A8 朗读中按钮变「停止」', (await page.locator('#readBtnTxt').textContent()) === '停止');
  if (voicesJson === V_NONE) {
    const toastTxt = await page.locator('#toast').textContent();
    ok('A7b 无中文语音 → 明确降级提示（不静默）', /未检测到中文语音/.test(toastTxt), toastTxt);
  }
  await page.waitForTimeout(lineCount * 900 + 400);
  const s1 = await page.evaluate(() => window.__tts);
  ok('A2 分段队列：每行一个 utterance', s1.spoken.length === lineCount, s1.spoken);
  ok('A3 单段不是整首 join', s1.spoken.every(x => x.text.length < 30), s1.spoken);
  ok('A4 破音字：山行「石径斜」叶韵 →「石径霞」', s1.spoken[0].text.includes('石径霞'), s1.spoken[0]);
  ok('A5 默认语速 0.85', s1.cfgs[0].rate === 0.85, s1.cfgs[0]);
  ok('A6 lang=zh-CN', s1.cfgs[0].lang === 'zh-CN', s1.cfgs[0]);
  if (voicesJson === V_MULTI) ok('A7a 音色优选：选中「普通话本地合成」', s1.cfgs[0].voice === '普通话本地合成', s1.cfgs[0].voice);
  await page.screenshot({ path: OUT + `/${tag}-1-playing.png` });

  await page.locator('#view-detail .read-btn').first().click();
  await page.waitForTimeout(80);
  await page.locator('.vline').nth(lineCount - 1).click();
  await page.waitForTimeout(700);
  const s2 = await page.evaluate(() => window.__tts);
  const tail = s2.spoken.slice(-3);
  ok('A9 单句循环：末句重复播报', tail.filter(x => x.text === s2.spoken[s2.spoken.length - 1].text).length >= 2, tail);
  await page.locator('.vline').nth(0).click();
  await page.waitForTimeout(500);
  const s3 = await page.evaluate(() => window.__tts);
  ok('A10 点其他句切换循环', s3.spoken[s3.spoken.length - 1].text !== s2.spoken[s2.spoken.length - 1].text || s3.cancels > s2.cancels);

  await page.locator('#view-detail .read-btn').first().click();
  await page.waitForTimeout(150);
  ok('A11 停止后按钮复位「听朗读」', (await page.locator('#readBtnTxt').textContent()) === '听朗读');
  ok('A12 停止触发 cancel', (await page.evaluate(() => window.__tts.cancels)) > 0);

  await page.locator('#view-detail .read-btn').first().click();
  await page.waitForTimeout(100);
  const before = await page.evaluate(() => window.__tts.cancels);
  await page.locator('#view-detail .back').click();
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => window.__tts.cancels);
  ok('A13 离开详情页（showView）自动 cancel', after === before + 1, { before, after });
  await page.evaluate(() => openDetail(POEMS[0].id));
  await page.waitForTimeout(150);
  ok('A14 openDetail 打断旧朗读', (await page.evaluate(() => window.__tts.cancels)) >= after + 1);
  await ctx.close();
}
await runRound('nozh', V_NONE);
await runRound('multi', V_MULTI);

/* ============ 破音字表 v2 返工断言（灵玉 #58 复核建议 1-5） ============ */
console.log('\n=== 破音字表 v2 返工断言 ===');
{
  const { ctx, page } = await open(V_MULTI);
  const r = await page.evaluate(() => {
    const f = (s, ma) => ttsFix(s, ma);
    return {
      xieRhyme: f('远上寒山石径斜，白云生处有人家。', true),
      xieNoRhyme: f('远上寒山石径斜，白云生处有人家。', false),
      moguyuer: f('斜阳正在', true),
      sumuzhe: f('山映斜阳天接水', true),
      tashaxing: f('杜鹃声里斜阳暮', true),
      dingfengbo: f('山头斜照却相迎', true),
      hougongci: f('斜倚薰笼坐到明', true),
      binmao: f('乡音无改鬓毛衰', false),
      yiqi: f('一骑红尘妃子笑', false),
      yekuang: f('野旷天低树', true),
      quexNeixun: f('自小阙内训', false),
      wuqueShi: f('圣朝无阙事', false),
      gongque: f('宫阙万间都做了土', false),
      huanxisha: f('浣溪沙', false),
      kehan: f('可汗大点兵', false),
      jianNiuYang: f('风吹草低见牛羊', false),
      rhymeMaTrue: poemRhymesMa(['远上寒山石径斜，白云生处有人家。', '停车坐爱枫林晚，霜叶红于二月花。']),
      rhymeMaFalse: poemRhymesMa(['月落乌啼霜满天，江枫渔火对愁眠。']),
      tableLen: TTS_FIXES.length,
      hasGlobalXie: TTS_FIXES.some(([a]) => a === '斜'),
    };
  });
  ok('B1 叶韵成立：句末+麻韵 → 石径霞', r.xieRhyme.includes('石径霞') && !r.xieRhyme.includes('石径斜'));
  ok('B2 无麻韵上下文 → 斜不动（保持统读 xié）', r.xieNoRhyme.includes('石径斜') && !r.xieNoRhyme.includes('石径霞'));
  ok('B3 非句末「斜阳正在」不替换（摸鱼儿）', !r.moguyuer.includes('霞'), r.moguyuer);
  ok('B4 非句末「山映斜阳」不替换（苏幕遮）', !r.sumuzhe.includes('霞'), r.sumuzhe);
  ok('B5 句末非麻韵诗「斜阳暮」不替换（踏莎行）', !r.tashaxing.includes('霞'), r.tashaxing);
  ok('B6 「山头斜照」不替换（定风波）', !r.dingfengbo.includes('霞'), r.dingfengbo);
  ok('B7 「斜倚薰笼」不替换（后宫词）', !r.hougongci.includes('霞'), r.hougongci);
  ok('B8 保留：鬓毛衰 → 鬓毛崔', r.binmao === '乡音无改鬓毛崔', r.binmao);
  ok('B9 保留：一骑 → 一寄', r.yiqi === '一寄红尘妃子笑', r.yiqi);
  ok('B10 返工：野旷已删除（不动）', r.yekuang === '野旷天低树', r.yekuang);
  ok('B11 收窄：通"缺"的「阙内训」不动', r.quexNeixun === '自小阙内训', r.quexNeixun);
  ok('B12 收窄：「无阙事」不动', r.wuqueShi === '圣朝无阙事', r.wuqueShi);
  ok('B13 白名单：宫阙 → 宫却', r.gongque.includes('宫却'), r.gongque);
  ok('B14 保留：浣溪沙 → 换溪沙', r.huanxisha === '换溪沙', r.huanxisha);
  ok('B15 死规则保留：可汗 → 克含（待扩容生效）', r.kehan === '克含大点兵', r.kehan);
  ok('B16 死规则保留：见牛羊 → 现牛羊', r.jianNiuYang === '风吹草低现牛羊', r.jianNiuYang);
  ok('B17 poemRhymesMa（山行押麻韵）= true', r.rhymeMaTrue === true);
  ok('B18 poemRhymesMa（枫桥夜泊非麻韵）= false', r.rhymeMaFalse === false);
  ok('B19 全局「斜」条目已移除', r.hasGlobalXie === false);
  ok(`B20 覆盖表条数 ${r.tableLen}（≥20）`, r.tableLen >= 20, r.tableLen);
  await ctx.close();
}

/* ============ 音色优选 + 朗读设置面板 ============ */
console.log('\n=== 音色优选 / 朗读设置面板 ===');
{
  const { ctx, page } = await open(V_MULTI);
  const score = await page.evaluate(() => {
    const vs = listZhVoices();
    return { picked: pickZhVoice() && zhVoice.name, scored: vs.map(v => [v.name, voiceScore(v)]), zhOnly: vs.length };
  });
  ok('C1 zh 语音筛选（排除粤语 yue-HK）', score.zhOnly === 4, score.zhOnly);
  ok('C2 优选最高分 = 普通话本地合成', score.picked === '普通话本地合成', { picked: score.picked, scored: score.scored });
  const twScore = score.scored.find(([n]) => /Taiwan/.test(n))[1];
  const cnScore = score.scored.find(([n]) => /普通话本地/.test(n))[1];
  ok('C3 港台音色降权（低于大陆普通话）', twScore < cnScore, { twScore, cnScore });

  await page.evaluate(() => openReadingSettings());
  await page.waitForTimeout(400);
  // 注：innerHTML 是 DOM property 不是 attribute，getAttribute('innerHTML') 恒为 null，必须取 property
  const html = await page.evaluate(() => document.querySelector('#rsetBody').innerHTML);
  ok('C4 设置面板出现「朗读语速」+「朗读音色」区', /朗读语速/.test(html) && /朗读音色/.test(html), html.slice(0, 120));
  await page.screenshot({ path: OUT + '/settings-panel.png' });

  await page.evaluate(() => setTts('rate', 1.0));
  await page.waitForTimeout(100);
  const st1 = await page.evaluate(() => ({ ls: JSON.parse(localStorage.getItem('xjy_tts') || '{}'), name: ttsRateName() }));
  ok('C5 语速「快」写入 localStorage (1.0)', st1.ls.rate === 1.0 && st1.name === '快', st1);
  await page.evaluate(() => { closeReadingSettings(); openDetail(POEMS.find(x => x.title.includes('山行')).id); readAloud(); });
  await page.waitForTimeout(150);
  const c = await page.evaluate(() => window.__tts.cfgs);
  ok('C6 朗读实际语速 = 设置值 1.0', c[c.length - 1].rate === 1.0, c[c.length - 1]);

  await page.evaluate(() => { stopSpeech(); setTts('voice', 'Yaoyao Online'); });
  await page.waitForTimeout(100);
  await page.evaluate(() => readAloud());
  await page.waitForTimeout(150);
  const c2 = await page.evaluate(() => window.__tts.cfgs);
  ok('C7 指定音色生效（Yaoyao Online）', c2[c2.length - 1].voice === 'Yaoyao Online', c2[c2.length - 1]);

  await page.evaluate(() => { stopSpeech(); setTts('voice', 'auto'); });
  await page.waitForTimeout(100);
  await page.evaluate(() => readAloud());
  await page.waitForTimeout(150);
  const c3 = await page.evaluate(() => window.__tts.cfgs);
  ok('C8 恢复 auto → 回到优选音色', c3[c3.length - 1].voice === '普通话本地合成', c3[c3.length - 1]);
  await ctx.close();
}
{
  const { ctx, page } = await open(V_NONE);
  await page.evaluate(() => openReadingSettings());
  await page.waitForTimeout(300);
  const note = await page.evaluate(() => document.querySelector('#rsetBody').innerHTML);
  ok('C9 无中文语音时面板给出明确说明', /未检测到中文语音/.test(note));
  await page.screenshot({ path: OUT + '/settings-panel-nozh.png' });
  await ctx.close();
}

await browser.close();
console.log(`\n════════ #58 打回项汇总 ════════`);
console.log(`通过 ${pass} / 失败 ${fail}`);
process.exit(fail === 0 ? 0 : 1);
