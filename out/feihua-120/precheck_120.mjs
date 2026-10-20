// 预检：① 当前池同 key STRIP 重复（预存 vs 本轮新增）② 注记标记扫描 ③ 弯引号等禁碰项复扫
import { readFileSync } from 'fs';
const lines = readFileSync('D:/ZCode/小程序/xijiangyue/index.html', 'utf8').split(/\r?\n/);
const FH = JSON.parse(lines[752].trim());
const STRIPRE = /[，。！？、；：「」''《》（）——…·〔〕()\[\]{}\s]/g;
let preColl = 0; const preDetail = [];
for (const k of Object.keys(FH.lines)) {
  const seen = new Map();
  for (const e of FH.lines[k]) {
    const s = e.replace(STRIPRE, '');
    if (seen.has(s)) { preColl++; preDetail.push(`${k}: 「${s}」 ×2+ (${seen.get(s)} / ${e})`); }
    else seen.set(s, e);
  }
}
console.log('① 当前池同 key STRIP 后重复（预存）=', preColl);
preDetail.slice(0, 10).forEach(d => console.log('   ', d));
// ② 310 条里的注记标记扫描
const cands = JSON.parse(readFileSync('D:/AgentHub/temp/xjy-120-feihua/candidates_120.json', 'utf8'));
const NOTE = /(从[^\[\]]{1,10}改|疑为|一作|本作|当作|卷[一二三四五六七八九十百]|页[一二三四五六七八九十百]|阙|缺字|衍文|讹)/;
const noted = cands.filter(c => NOTE.test(c.e));
console.log('② 含注记标记的候选 =', noted.length);
noted.forEach(c => console.log(`   ${c.k}#${c.i}  ${c.e}`));
// ③ 禁碰项复扫（x 桶弯引号/灯#1040 必须在池且不动）
const flat = [];
for (const k of Object.keys(FH.lines)) FH.lines[k].forEach((e, i) => flat.push({ k, i, e }));
console.log('③ 弯引号条目在池 =', flat.filter(x => /[\u201C\u201D\u2018\u2019]/.test(x.e)).length, '（应 152，x 桶）');
console.log('   灯#1040 在池 =', flat.filter(x => x.e === '灯灯作{牙丿=丶}因').length, '（应 1，x 桶）');
console.log('   〖〗条目在池 =', flat.filter(x => /[\u3016\u3017]/.test(x.e)).length, '（应 0）');
console.log('   ext-B 条目在池 =', flat.filter(x => /[\u{10000}-\u{10FFFF}]/u.test(x.e)).length, '（应 0）');
