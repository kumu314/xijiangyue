// 全量 310 条审核视图 + 口径对账
import { readFileSync, writeFileSync } from 'fs';
const out = JSON.parse(readFileSync('D:/AgentHub/temp/xjy-120-feihua/candidates_120.json', 'utf8'));
const RE_NUM = /^[一二三四五六七八九十百千零〇两0-9\d]+$/;
const RE_CJK = /^[\u4e00-\u9fff]+$/;

// 口径对账：按括号次数 vs 按条目
let occFirst = 0, occMid = 0, occEnd = 0, occSingle = 0, occMulti = 0;
for (const o of out) {
  // 重新按出现次数枚举每个括号的位置
  const re = /\[([^\]]*)\]/g; let m; const occ = [];
  while ((m = re.exec(o.e)) !== null) occ.push({ s: m.index, len: m[0].length, inner: m[1] });
  for (const c of occ) {
    if (c.s === 0) occFirst++; else if (c.s + c.len === o.e.length) occEnd++; else occMid++;
    if (c.inner.length === 1) occSingle++; else occMulti++;
  }
}
console.log('按次数：句首', occFirst, '句中', occMid, '句尾', occEnd, '| 单字括号', occSingle, '多字括号', occMulti, '（对账灵玉 54/206/57、273/37）');
const multiBracket = out.filter(o => o.innerN > 1);
console.log('多括号条目数 =', multiBracket.length, '（次数-条目差 =', occFirst + occMid + occEnd - out.length, '）');

// 分类打标
function classify(o) {
  const inners = o.inner.split('|');
  const allNum = inners.every(s => RE_NUM.test(s));
  const allCJK1 = inners.every(s => s.length === 1 && RE_CJK.test(s));
  if (allNum) return '编号';
  if (inners.every(s => s.length === 1)) return '单字';
  if (inners.every(s => RE_CJK.test(s))) return '多字CJK';
  return '杂:' + inners.join('/');
}
const groups = {};
for (const o of out) { const c = classify(o); (groups[c] = groups[c] || []).push(o); }
console.log('分类分布 =', JSON.stringify(Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length]))));

// 审核视图：按分类输出，每行 key#idx | 原串 | 补字clean | 删段clean | 标记
const lines = [];
for (const [g, items] of Object.entries(groups)) {
  lines.push('### ' + g + ' (' + items.length + ')');
  for (const o of items) {
    const drop = o.e.replace(/\[([^\]]*)\]/g, '');
    const flags = [o.sameDup ? '★同key重复→' + o.sameDupWith : '', o.cleanLen < 5 ? '⚠' + o.cleanLen + '字' : '', o.crossKeys.length ? '跨' + o.crossKeys.join('') : ''].filter(Boolean).join(' ');
    lines.push(`${o.k}#${o.i}\t${o.e}\t[补]${o.clean}\t[删]${drop}\t${flags}`);
  }
}
writeFileSync('D:/AgentHub/temp/xjy-120-feihua/review_120.txt', lines.join('\n'));
console.log('已写 review_120.txt，共', lines.length, '行');
// 杂类单列打印
if (groups['杂:' ] || Object.keys(groups).some(k => k.startsWith('杂'))) {
  for (const k of Object.keys(groups)) if (k.startsWith('杂')) { console.log('=== ' + k + ' ==='); for (const o of groups[k]) console.log(` ${o.k}#${o.i}  ${o.e}  [补]${o.clean}`); }
}
