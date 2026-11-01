/* 体验四项修复验证 —— 灵玉 2026-11-01
   ② 未登录默认进度 = 真值 0/0
   ③ 今日任务不再断言「已掌握」；有到期温故时首卡=温故
   ④ 竖排区自适应收高：短诗不再留 43%~64% 空白；scrollHeight<=clientHeight（无裁切）
   ⑤ 特大+松档「兮」断点：fragLine('目眇眇兮愁予',4) = 目眇眇兮/愁予
   自证纪律：每档打印实际生效参数（--reader-fs / 容器高度） */
process.env.TMPDIR = process.env.TMPDIR || 'D:/AgentHub/tmp';
import pw from 'file:///D:/ZCode/%E5%B0%8F%E7%A8%8B%E5%BA%8F/xijiangyue/tests/node_modules/playwright-core/index.mjs';
const { chromium } = pw;
const FILE = 'file:///D:/ZCode/%E5%B0%8F%E7%A8%8B%E5%BA%8F/xijiangyue/index.html';
const R = [];
const ok = (n, c, d) => { R.push([c?'PASS':'FAIL', n, d===undefined?'':String(d)]); if(!c) process.exitCode=1; };

const browser = await chromium.launch({ channel:'chrome', headless:true });
const page = await browser.newPage({ viewport:{ width:390, height:844 } });
const errs = [];
page.on('pageerror', e=>errs.push(String(e)));
page.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
await page.goto(FILE, { waitUntil:'load' });
await page.waitForTimeout(1000);

// ---- ② 未登录默认进度 ----
const prog = await page.evaluate(() => ({ learned: progress.learned, streak: progress.streak }));
ok('② 未登录默认 learned=0', prog.learned===0, JSON.stringify(prog));
ok('② 未登录默认 streak=0', prog.streak===0, JSON.stringify(prog));
await page.evaluate(() => { [...document.querySelectorAll('.tb')].find(x=>/学习/.test(x.textContent))?.click(); });
await page.waitForTimeout(300);
const meTxt = await page.evaluate(() => document.body.innerText);
ok('② 首页不再出现「已学 12」假数', !/已学\s*12\b/.test(meTxt), '');
ok('② 不再出现「还差 8 首」（12/20 的残影）', !/还差\s*8\s*首/.test(meTxt), '');

// ---- ③ 今日任务 ----
const tasks0 = await page.evaluate(() => document.querySelector('#learnTasks').innerText);
ok('③ 无到期时首卡不写「已掌握」', !tasks0.includes('已掌握'), tasks0.split('\n').slice(0,4).join(' / '));
ok('③ 无到期时不出现「复习《》」假复习', !tasks0.includes('复习《'), tasks0.split('\n').slice(0,4).join(' / '));
ok('③ 首卡是「今日首学」', tasks0.includes('今日首学'), '');
// 种一颗今天到期的温故 → 首卡应变温故
const seeded = await page.evaluate(() => {
  const p = POEMS.find(x=>x.id==='jingyesi') || POEMS[0];
  const today = localDay();
  const r = {}; r[p.id] = { bucket:1, due:today, last:today, v:2 };
  localStorage.setItem(LS_REVIEW, JSON.stringify(r));
  renderLearn();
  return { title: p.title, tasks: document.querySelector('#learnTasks').innerText,
           rv: (document.querySelector('.rv-card')||{}).innerText || '' };
});
ok('③ 有到期时首卡=温故《静夜思》', seeded.tasks.includes('温故《'), seeded.tasks.split('\n').slice(0,3).join(' / '));
ok('③ 温故卡与今日任务同源（都指向到期篇）', seeded.rv.includes(seeded.title) && seeded.tasks.includes(seeded.title), seeded.title);
// 清掉种子，恢复
await page.evaluate(() => { localStorage.removeItem(LS_REVIEW); renderLearn(); });

// ---- ⑤ fragLine 兮断点（纯函数，全档全句式）----
const frag = await page.evaluate(() => {
  const cases = [];
  for (const t of ['目眇眇兮愁予','帝子降兮北渚','沅有芷兮澧有兰','君问归期未有期，','与佳期兮夕张']) {
    for (const cap of [4,5,6,7,8]) cases.push({ t, cap, out: fragLine(t, cap) });
  }
  return cases;
});
ok('⑤ 目眇眇兮愁予@cap4 = 目眇眇兮/愁予', JSON.stringify(frag.find(x=>x.t==='目眇眇兮愁予'&&x.cap===4).out)===JSON.stringify(['目眇眇兮','愁予']),
   JSON.stringify(frag.find(x=>x.t==='目眇眇兮愁予'&&x.cap===4).out));
ok('⑤ 帝子降兮北渚@cap4 不回归（仍 帝子降兮/北渚）', JSON.stringify(frag.find(x=>x.t==='帝子降兮北渚'&&x.cap===4).out)===JSON.stringify(['帝子降兮','北渚']),
   JSON.stringify(frag.find(x=>x.t==='帝子降兮北渚'&&x.cap===4).out));
// 任何段都不得超 cap（含兮拉入+标点悬挂组合）
const overflow = frag.filter(x => x.out.some(s => [...s].length > x.cap));
ok('⑤ 全组合无超 cap 段', overflow.length===0, JSON.stringify(overflow.slice(0,2)));

// ---- ④ 竖排收高：3 首 × 4 字号 × 3 行距 ----
const SAMPLES = ['jingyesi','xf_01eb95fe','t3_df729760'];   // 短诗 / 中篇 / 长篇各一
const SIZES = ['小','中','大','特大'], SPS = ['紧','适中','松'];
let combos = 0, fits = 0, shrank = 0, bad = [];
for (const pid of SAMPLES) {
  for (const s of SIZES) for (const sp of SPS) {
    await page.evaluate(([id, sz, sp2]) => {
      [...document.querySelectorAll('.tb')].find(x=>/诗库|首页|库/.test(x.textContent))?.click();
      setFont('size', sz); setFont('spacing', sp2);
      openDetail(id);
    }, [pid, s, sp]);
    await page.waitForTimeout(160);
    const m = await page.evaluate(() => {
      const vb = document.querySelector('.vbody');
      if (!vb) return null;
      const cs = getComputedStyle(vb);
      const vfs = vb.children[0] ? getComputedStyle(vb.children[0]).fontSize : '?';
      return { wm: cs.writingMode, h: vb.clientHeight, sh: vb.scrollHeight,
               fs: vfs, n: vb.children.length };
    });
    if (!m || m.wm.indexOf('vertical')!==0) continue;
    combos++;
    const fit = m.sh <= m.h + 1;
    if (fit) fits++; else bad.push({ pid, s, sp, ...m });
    if (m.h < 299) shrank++;
    if (combos===1 || s==='特大')
      console.log(`  · ${pid} ${s}+${sp}: --reader-fs=${m.fs} 高=${m.h} scroll=${m.sh} 列=${m.n} ${fit?'✓':'✗裁'}`);
  }
}
ok(`④ ${combos} 组合零裁切（scrollHeight<=clientHeight）`, fits===combos, JSON.stringify(bad.slice(0,3)));
ok('④ 短诗容器确实收高了（存在 h<300 的组合）', shrank>0, `shrank=${shrank}/${combos}`);
// 填充率对照：短诗在 中/适中 下
await page.evaluate(() => { setFont('size','中'); setFont('spacing','适中'); openDetail('jingyesi'); });
await page.waitForTimeout(200);
const fill = await page.evaluate(() => {
  const vb = document.querySelector('.vbody');
  return { h: vb.clientHeight, pct: Math.round(vb.clientHeight/300*100) };
});
ok('④ 短诗填充率显著高于原 36%', fill.pct >= 45, `h=${fill.h}px (${fill.pct}%)`);

ok('全程 0 pageerror / 0 console error', errs.length===0, errs.slice(0,2).join(' | '));
console.log('\n========== 结果 ==========');
for (const [s,n,d] of R) console.log(`${s} ${n}${d?'  '+d:''}`);
const np = R.filter(x=>x[0]==='PASS').length;
console.log(`RESULT: ${np} PASS / ${R.length-np} FAIL`);
await browser.close();
