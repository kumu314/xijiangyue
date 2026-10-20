// #120 探针：当前池 310 条方括号条目全字段导出
import { readFileSync, writeFileSync } from 'fs';
const HTML = 'D:/ZCode/小程序/xijiangyue/index.html';
const lines = readFileSync(HTML, 'utf8').split(/\r?\n/);
const raw753 = lines[752];
const FH = JSON.parse(raw753.trim());
const STRIPRE = /[，。！？、；：「」''《》（）——…·〔〕()\[\]{}\s]/g;
const RE_EXTB = /[\u{10000}-\u{10FFFF}]/u;
const RE_JU = /[\u3016\u3017]/;
const RE_BRACE = /[{}]/;
const RE_WAN = /[\u201C\u201D\u2018\u2019]/;
const RE_NUM = /^[一二三四五六七八九十百千零〇两0-9\d]+$/;

const flat = [];
for (const k of Object.keys(FH.lines)) FH.lines[k].forEach((e, i) => flat.push({ k, i, e }));
console.log('池 =', flat.length, '| keys =', Object.keys(FH.lines).length);

// 每 key 的 raw 集合与 clean 集合（用于重复判定）
const keyRaw = {}, keyClean = {};
for (const k of Object.keys(FH.lines)) {
  keyRaw[k] = new Set(FH.lines[k]);
  keyClean[k] = new Set(FH.lines[k].map(e => e.replace(STRIPRE, '')));
}

const brk = flat.filter(x => /[\[\]]/.test(x.e));
console.log('方括号条目 =', brk.length);

const out = brk.map(x => {
  const inners = [...x.e.matchAll(/\[([^\]]*)\]/g)].map(m => m[1]);
  const clean = x.e.replace(STRIPRE, '');
  const firstIdx = x.e.search(/[\[\]]/);
  const pos = firstIdx === 0 ? '句首' : (x.e.endsWith(']') ? '句尾' : '句中');
  // 同 key 重复：clean 是否已作为该 key 另一条目的 raw/clean 存在
  let sameDup = false, sameDupWith = '';
  const sameIdx = FH.lines[x.k].findIndex((e2, i2) => i2 !== x.i && (e2 === x.e || e2.replace(STRIPRE, '') === clean));
  if (sameIdx >= 0) { sameDup = true; sameDupWith = x.k + '#' + sameIdx + ':' + FH.lines[x.k][sameIdx]; }
  // 跨 key：clean 是否在其他 key 出现
  const crossKeys = [];
  for (const k2 of Object.keys(FH.lines)) {
    if (k2 === x.k) continue;
    if (FH.lines[k2].some(e2 => e2.replace(STRIPRE, '') === clean)) crossKeys.push(k2);
  }
  return {
    k: x.k, i: x.i, e: x.e,
    inner: inners.join('|'),
    innerN: inners.length,
    innerLen: inners.map(s => s.length),
    innerIsNum: inners.every(s => RE_NUM.test(s)),
    pos, clean, cleanLen: clean.length,
    hasKey: clean.includes(x.k),
    hasExtB: RE_EXTB.test(x.e), hasJU: RE_JU.test(x.e), hasBrace: RE_BRACE.test(x.e), hasWan: RE_WAN.test(x.e),
    sameDup, sameDupWith, crossKeys
  };
});

// 形态分布（对账灵玉三组数）
const d = {
  总数: out.length,
  括号内单字: out.filter(o => o.innerN === 1 && o.innerLen[0] === 1).length,
  括号内多字: out.filter(o => !(o.innerN === 1 && o.innerLen[0] === 1)).length,
  句首: out.filter(o => o.pos === '句首').length,
  句中: out.filter(o => o.pos === '句中').length,
  句尾: out.filter(o => o.pos === '句尾').length,
  同key重复: out.filter(o => o.sameDup).length,
  跨key重复: out.filter(o => o.crossKeys.length > 0).length,
  clean长度不足5: out.filter(o => o.cleanLen < 5).length,
  clean不含key: out.filter(o => !o.hasKey).length,
  括号内为编号: out.filter(o => o.innerIsNum).length,
  含extB: out.filter(o => o.hasExtB).length, 含JU: out.filter(o => o.hasJU).length,
  含花括号: out.filter(o => o.hasBrace).length, 含弯引号: out.filter(o => o.hasWan).length,
};
console.log(JSON.stringify(d, null, 1));
console.log('--- 同 key 重复清单（★闸）---');
for (const o of out.filter(o => o.sameDup)) console.log(` ${o.k}#${o.i}  ${o.e}  ⇄  ${o.sameDupWith}`);
console.log('--- clean<5 清单 ---');
for (const o of out.filter(o => o.cleanLen < 5)) console.log(` ${o.k}#${o.i}  ${o.e}  → ${o.clean} (${o.cleanLen}字)`);
console.log('--- clean 不含 key 清单 ---');
for (const o of out.filter(o => !o.hasKey)) console.log(` ${o.k}#${o.i}  ${o.e}  → ${o.clean}`);
writeFileSync('D:/AgentHub/temp/xjy-120-feihua/candidates_120.json', JSON.stringify(out, null, 1));
console.log('已写 candidates_120.json');
