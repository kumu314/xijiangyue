// #120 终态五项自检（读应用后的真实文件）
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
const HTML = 'D:/ZCode/小程序/xijiangyue/index.html';
const html = readFileSync(HTML, 'utf8');
const lines = html.split('\n');
const FH = JSON.parse(lines[752].trim());
const decs = JSON.parse(readFileSync('D:/AgentHub/temp/xjy-120-feihua/decisions_120.json', 'utf8'));
const S = /[，。！？、；：「」''《》（）——…·〔〕()\[\]{}\s]/g;

// 1 池/keys
let total = 0;
for (const k of Object.keys(FH.lines)) total += FH.lines[k].length;
console.log('1) 池 =', total, '（期望 71716）| keys =', Object.keys(FH.lines).length, '| 单 key 非空 =', Object.keys(FH.lines).every(k => FH.lines[k].length > 0));

// 2 POEMS 935（761 行起，753 行外）
const pi = lines.findIndex(l => l.startsWith('const POEMS = ['));
let pd = 0, pe = -1, st = false;
for (let j = pi; j < lines.length && pe < 0; j++) {
  for (const ch of lines[j]) {
    if (ch === '[') { pd++; st = true; } else if (ch === ']') { pd--; if (st && pd === 0) { pe = j; break; } }
  }
}
const txt = lines.slice(pi, pe + 1).join('\n').replace(/^const POEMS = /, '').replace(/;\s*$/, '');
const P = JSON.parse(txt);
console.log('2) POEMS =', P.length, '条（期望 935；行 ' + (pi + 1) + '→' + (pe + 1) + '，在 753 行外 ⇒ 块外零变即逐字节未动）');

// 3 STRIP 行 / CRLF / round-trip
const si = lines.findIndex(l => l.includes('，。！？、；：「」'));
console.log('3) STRIP 行 =', si + 1, '| 含 \\\\[\\\\]（方花括号在 STRIP 内）=', /\\[\\]/.test(lines[si]), '| CRLF =', (html.match(/\r/g) || []).length, '| round-trip =', lines[752].trim() === JSON.stringify(FH));

// 4 同 key 重复闸（终态）
let dup = 0;
const dupD = [];
for (const k of Object.keys(FH.lines)) {
  const seen = new Map();
  for (const e of FH.lines[k]) {
    const s = e.replace(S, '');
    if (seen.has(s)) { dup++; dupD.push(k + ':' + s); } else seen.set(s, e);
  }
}
console.log('4) 终态同 key STRIP 重复 =', dup, '（方括号相关应为 0；余为预存非方括号项）');
dupD.forEach(d => console.log('     ', d));

// 5 (a)/(b)/(x) 终态在位性 + (a) 四判据
let okA = 0, okX = 0, okB = 0;
const bad = [];
for (const d of decs.filter(d => d.disp === 'a')) {
  if (!FH.lines[d.k].includes(d.final)) { bad.push('(a) 丢失 ' + d.k + '#' + d.i); continue; }
  okA++;
  if (/[\[\]]/.test(d.final) || !d.final.includes(d.k) || d.final.length < 5) bad.push('(a) 判据 ' + d.k + '#' + d.i);
}
for (const d of decs.filter(d => d.disp === 'x')) { if (FH.lines[d.k].includes(d.e)) okX++; else bad.push('(x) 丢失 ' + d.k + '#' + d.i); }
for (const d of decs.filter(d => d.disp === 'b')) { if (!FH.lines[d.k].includes(d.e)) okB++; else bad.push('(b) 未删 ' + d.k + '#' + d.i); }
console.log('5) (a) 在位且过四判据 =', okA, '/ 241 | (x) 原样 =', okX, '/ 54 | (b) 不在池 =', okB, '/ 15 | 异常 =', bad.length, bad.slice(0, 5).join(' ; '));

// 6 方括号残留复扫 + 禁碰项
const flat = [];
for (const k of Object.keys(FH.lines)) FH.lines[k].forEach(e => flat.push(e));
console.log('6) 终态方括号条目 =', flat.filter(e => /[\[\]]/.test(e)).length, '（期望 54 = x 桶）');
console.log('   弯引号 =', flat.filter(e => /[\u201C\u201D\u2018\u2019]/.test(e)).length, '| 灯#1040 =', flat.filter(e => e === '灯灯作{牙丿=丶}因').length, '| 〖〗 =', flat.filter(e => /[\u3016\u3017]/.test(e)).length, '| ext-B =', flat.filter(e => /[\u{10000}-\u{10FFFF}]/u.test(e)).length);

// 7 双 sha256
const sha = s => createHash('sha256').update(s).digest('hex');
console.log('7) index.html sha256 =', sha(html));
console.log('   decisions_120.json sha256 =', sha(readFileSync('D:/AgentHub/temp/xjy-120-feihua/decisions_120.json', 'utf8')));
