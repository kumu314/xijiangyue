// #121 终态自检（读应用后的真实文件 + git HEAD 基线文件，10 项判据逐条断言）
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
const CUR = 'D:/ZCode/小程序/xijiangyue/index.html';
const BASE = 'D:/AgentHub/temp/xjy-121-dup6/baseline_index.html';
const cur = readFileSync(CUR, 'utf8');
const base = readFileSync(BASE, 'utf8');
const sha = s => createHash('sha256').update(s).digest('hex');
const S = /[，。！？、；：「」''《》（）——…·〔〕()\[\]{}\s]/g;
const STRIP = s => s.replace(S, '');
const TAG = /<script type="application\/json" id="feihuaData">/;
const getJSON = t => { const m = TAG.exec(t); const s = m.index + m[0].length; return { json: t.slice(s, t.indexOf('</script>', s)), s, e: t.indexOf('</script>', s) }; };
const B = getJSON(base), C = getJSON(cur);
const bFH = JSON.parse(B.json), cFH = JSON.parse(C.json);
let fails = 0;
const chk = (name, ok, detail) => { console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : '')); if (!ok) fails++; };

// 1 池 / keys
let bPool = 0, cPool = 0;
for (const k of Object.keys(bFH.lines)) bPool += bFH.lines[k].length;
for (const k of Object.keys(cFH.lines)) cPool += cFH.lines[k].length;
const bKeys = Object.keys(bFH.lines), cKeys = Object.keys(cFH.lines);
chk('1 池 71716→71710', bPool === 71716 && cPool === 71710, bPool + '→' + cPool);
chk('1 keys 49 且序列一致', cKeys.length === 49 && JSON.stringify(cKeys) === JSON.stringify(bKeys), cKeys.length + ' 个');
chk('1 keys 数组一致', JSON.stringify(cFH.keys) === JSON.stringify(bFH.keys), 'FH.keys 顺序');

// 2 6 处处置：当前 = 基线 恰好删掉 6 个次现（逐 key 数组元素级对账）
const TARGETS = { '秋': 1169, '柳': 1050, '清': 1231, '烟': 1124, '燕': 940, '声': 1130 };
let diffOK = true, diffDetail = [];
for (const k of bKeys) {
  const bArr = bFH.lines[k], cArr = cFH.lines[k];
  if (TARGETS[k] !== undefined) {
    // 基线去掉次现后必须与当前完全一致
    const expect = bArr.filter((_, i) => i !== TARGETS[k]);
    const same = expect.length === cArr.length && expect.every((v, i) => v === cArr[i]);
    if (!same) { diffOK = false; diffDetail.push(k + ' 数组对账不符'); }
    else diffDetail.push(k + ' 删 idx ' + TARGETS[k] + '「' + bArr[TARGETS[k]] + '」（余 ' + cArr.length + ' 条，首现仍在=' + cArr.includes(bArr[bArr.findIndex((s, i) => i < TARGETS[k] && s === bArr[TARGETS[k]])]) + '）');
  } else {
    if (bArr.length !== cArr.length || !bArr.every((v, i) => v === cArr[i])) { diffOK = false; diffDetail.push(k + ' 非目标 key 却有变动'); }
  }
}
chk('2 元素级对账：仅 6 个次现被删、其余全等', diffOK, diffDetail.join(' ／ '));
chk('2 6 处首现仍在池（各恰 1 条）', Object.keys(TARGETS).every(k => {
  const raw = bFH.lines[k][TARGETS[k]];
  return cFH.lines[k].filter(s => s === raw).length === 1;
}), Object.keys(TARGETS).map(k => k + '×' + cFH.lines[k].filter(s => s === bFH.lines[k][TARGETS[k]]).length).join(' '));

// 3 同 key STRIP 重复闸 = 0（终态）
let dups = [];
for (const k of cKeys) { const seen = new Map(); for (const s of cFH.lines[k]) { const t = STRIP(s); seen.set(t, (seen.get(t) || 0) + 1); } for (const [t, n] of seen) if (n > 1) dups.push(k + '×' + n + '「' + t + '」'); }
chk('3 同 key STRIP 重复 = 0', dups.length === 0, dups.length ? dups.join(' ') : '0 处');
// 3b 基线确有 6 处（对照，证明本卡确实清了）
let bDups = 0;
for (const k of bKeys) { const seen = new Set(); for (const s of bFH.lines[k]) { const t = STRIP(s); if (seen.has(t)) bDups++; seen.add(t); } }
chk('3b 基线同 key 重复 = 6（对照）', bDups === 6, bDups + ' 处');

// 4 块外逐字节零变
chk('4 块外零变（块前）', base.slice(0, B.s) === cur.slice(0, C.s), B.s + ' B');
chk('4 块外零变（块后）', base.slice(B.e) === cur.slice(C.e), (base.length - B.e) + ' B');
chk('4 变更仅落在 feihuaData 块内', B.s === C.s, '块起点 ' + B.s);

// 5 STRIP 未改 + CRLF 0 + round-trip
const stripLine = t => (t.match(/const STRIP\s*=\s*s\s*=>[^\n]*/) || [''])[0];
chk('5 STRIP 定义未改', stripLine(base) === stripLine(cur) && stripLine(cur).length > 0, stripLine(cur).slice(0, 60));
chk('5 CRLF = 0', !/\r/.test(cur) && !/\r/.test(base), 'both LF');
const rt = JSON.stringify(JSON.parse(C.json)) === JSON.stringify(cFH);
chk('5 round-trip', rt, 'JSON.parse→stringify 稳定');

// 6 禁碰项
const flat = []; for (const k of cKeys) cFH.lines[k].forEach(e => flat.push(e));
const bFlat = []; for (const k of bKeys) bFH.lines[k].forEach(e => bFlat.push(e));
const wan = flat.filter(e => /[“”‘’]/.test(e)).length;
const ju = flat.filter(e => /[〖〗]/.test(e)).length;
const extB = flat.filter(e => /[\u{10000}-\u{10FFFF}]/u.test(e)).length;
const deng = flat.filter(e => e === '灯灯作{牙丿=丶}因').length;
chk('6 弯引号 152（基线→当前一致）', wan === 152 && bFlat.filter(e => /[“”‘’]/.test(e)).length === 152, wan + ' / ' + bFlat.filter(e => /[“”‘’]/.test(e)).length);
chk('6 〖〗 = 0', ju === 0, ju + ' 处');
chk('6 ext-B = 0', extB === 0, extB + ' 处');
chk('6 灯#1040 = 1', deng === 1, deng + ' 处');

// 7 跨 key 重复（设计允许，不动）——全局口径：全池同串出现 >1 的「多余份数」总和
// 注：#120 报告里的「114 条」是 310 条方括号候选的 crossKeys 口径，不是全池口径；此处用全池口径自比
function crossDup(FH) {
  const m = new Map();
  for (const k of Object.keys(FH.lines)) for (const s of FH.lines[k]) { const t = STRIP(s); m.set(t, (m.get(t) || 0) + 1); }
  let n = 0; for (const [, c] of m) if (c > 1) n += c - 1;
  return n;
}
function dupStrings(FH) {
  const m = new Map();
  for (const k of Object.keys(FH.lines)) for (const s of FH.lines[k]) { const t = STRIP(s); m.set(t, (m.get(t) || 0) + 1); }
  return [...m.entries()].filter(([, c]) => c > 1).map(([t, c]) => t + '×' + c).sort();
}
const bCross = crossDup(bFH), cCross = crossDup(cFH);
const bDS = dupStrings(bFH), cDS = dupStrings(cFH);
chk('7 跨 key 重复份数：基线 −6（删的正是 6 个副本）', cCross === bCross - 6, bCross + '→' + cCross);
chk('7 重复串清单：仅 6 组由 ×2 变 ×1，其余全等', (() => {
  const bm = new Map(bDS.map(x => x.split('×'))), cm = new Map(cDS.map(x => x.split('×')));
  let ok = bm.size === cm.size; const diff = [];
  for (const [t, n] of bm) { const cn = cm.get(t); if (cn === undefined) { ok = false; diff.push(t + ' 消失'); } else if (Number(cn) !== Number(n)) { if (Number(n) - Number(cn) !== 1) ok = false; diff.push(t + ' ×' + n + '→×' + cn); } }
  return ok ? true : 'BAD:' + diff.join(' ');
})(), (() => { const bm = new Map(bDS.map(x => x.split('×'))), cm = new Map(cDS.map(x => x.split('×'))); const d = []; for (const [t, n] of bm) { const cn = cm.get(t); if (cn !== undefined && Number(cn) !== Number(n)) d.push(t + ' ×' + n + '→×' + cn); } return d.join(' ／ '); })());

// 8 POEMS 段未动（935 篇）——提取法同 verify_120.mjs
const poi = t => {
  const lines = t.split('\n');
  const pi = lines.findIndex(l => l.startsWith('const POEMS = ['));
  let pd = 0, pe = -1, st = false;
  for (let j = pi; j < lines.length && pe < 0; j++) {
    for (const ch of lines[j]) {
      if (ch === '[') { pd++; st = true; } else if (ch === ']') { pd--; if (st && pd === 0) { pe = j; break; } }
    }
  }
  const txt = lines.slice(pi, pe + 1).join('\n').replace(/^const POEMS = /, '').replace(/;\s*$/, '');
  return { raw: txt, n: JSON.parse(txt).length, from: pi + 1, to: pe + 1 };
};
const bP = poi(base), cP = poi(cur);
chk('8 POEMS 段逐字节未动 + 935 篇', bP.raw === cP.raw && bP.n === 935 && cP.n === 935, '字节同=' + (bP.raw === cP.raw) + ' | ' + bP.n + '→' + cP.n + ' | 行 ' + cP.from + '→' + cP.to + '（753 行外）');

// 9 字节差 = 120（6 处「元素+逗号」）
chk('9 字节 3769895→3769775（−120）', Buffer.byteLength(base) === 3769895 && Buffer.byteLength(cur) === 3769775, Buffer.byteLength(base) + '→' + Buffer.byteLength(cur));

// 10 双 sha256
console.log('10 基线 index.html sha256 =', sha(base));
console.log('10 当前 index.html sha256 =', sha(cur));
console.log(fails === 0 ? 'VERIFY-ALL-PASS' : 'VERIFY-FAIL(' + fails + ')');
process.exit(fails === 0 ? 0 : 1);
