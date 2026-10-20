// #120 应用：防串位断言 + round-trip + 保格式回写
import { readFileSync, writeFileSync } from 'fs';
const T = 'D:/AgentHub/temp/xjy-120-feihua/';
const HTML = 'D:/ZCode/小程序/xijiangyue/index.html';
const decs = JSON.parse(readFileSync(T + 'decisions_120.json', 'utf8'));
const html = readFileSync(HTML, 'utf8');
const lines = html.split('\n');
if (lines.length < 753) throw new Error('行数不足');
const raw = lines[752];
// round-trip 前置断言（trim 口径，保留块首尾风格）
const FH = JSON.parse(raw.trim());
if (raw.trim() !== JSON.stringify(FH)) throw new Error('round-trip 前置断言失败');
console.log('round-trip 前置断言 PASS');

// 按 key 分组的操作表
const ops = {};
for (const d of decs) {
  (ops[d.k] = ops[d.k] || {})[d.i] = d;
}
// 防串位断言 + 应用
let nDel = 0, nRep = 0;
for (const k of Object.keys(FH.lines)) {
  const arr = [];
  FH.lines[k].forEach((e, i) => {
    const d = ops[k] && ops[k][i];
    if (d) {
      if (e !== d.e) throw new Error(`防串位断言失败 ${k}#${i}: 文件「${e}」≠ 判定登记「${d.e}」`);
      if (d.disp === 'b') { nDel++; return; }
      if (d.disp === 'a') { arr.push(d.final); nRep++; return; }
    }
    arr.push(e);
  });
  FH.lines[k] = arr;
}
console.log(`应用：删除 ${nDel} / 替换 ${nRep} / 原样 ${decs.filter(d=>d.disp==='x').length}`);
// 后置 round-trip
const out = JSON.stringify(FH);
if (JSON.parse(out).lines === undefined) throw new Error('后置 JSON 结构异常');
// 保格式回写：保留原 raw 的首尾空白风格
const pre = raw.match(/^\s*/)[0], suf = raw.match(/\s*$/)[0];
lines[752] = pre + out + suf;
const newHtml = lines.join('\n');
// 块外零变断言
const oldLines = html.split('\n');
let extDiff = 0;
for (let i = 0; i < Math.max(oldLines.length, lines.length); i++) {
  if (i === 752) continue;
  if (oldLines[i] !== lines[i]) { extDiff++; console.log('块外差异行', i, JSON.stringify((oldLines[i]||'').slice(0,60)), '→', JSON.stringify((lines[i]||'').slice(0,60))); }
}
if (extDiff !== 0) throw new Error('块外零变断言失败：' + extDiff + ' 行差异');
if (oldLines.length !== lines.length) throw new Error('行数变化');
console.log('块外零变 PASS（仅 753 数据行变化，行数不变）');
if (/\r/.test(newHtml)) throw new Error('CRLF 出现');
console.log('CRLF=0 PASS');
writeFileSync(HTML, newHtml);
console.log('已写 index.html，字节', oldLines.join('\n').length, '→', newHtml.length, `（Δ ${newHtml.length - html.length}）`);
