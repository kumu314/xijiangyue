// 补充复算：A3 严格检查 + A5 全量三写法 + B6 tags 明细
const fs = require('fs');
const vm = require('vm');
const parent = fs.readFileSync('parent_index.html', 'utf8');
const target = fs.readFileSync('target_index.html', 'utf8');
const out = [];
const L = (s) => out.push(String(s));

// ---- A3 严格：submitAnswer 函数体本身 ----
const saStart = target.indexOf('function submitAnswer');
const saEnd = target.indexOf('\n}', saStart) + 2;
const saBody = target.slice(saStart, saEnd);
L(`A3+ submitAnswer 函数体(长${saBody.length}) 含 FH.lines = ${/FH\.lines/.test(saBody)}（期望 false）; 含 FHN[ = ${/FHN\[/.test(saBody)}`);

// ---- 数据 ----
const tF = (() => { const s = target.indexOf('<script type="application/json" id="feihuaData">'); return { s, e: target.indexOf('</scr' + 'ipt>', s) }; })();
const fhJson = target.slice(tF.s, tF.e).replace(/^<script[^>]*>\s*/, '');
const FH = JSON.parse(fhJson);
const tStripSrc = target.match(/const STRIP = (.*)\n/)[1];
const STRIP = vm.runInNewContext('(' + tStripSrc.replace(/;\s*$/, '') + ')');
const FHN = {}; for (const k of FH.keys) FHN[k] = (FH.lines[k] || []).map(STRIP);

function makeRunner(input, key) {
  const ctx = {
    $: () => ({ value: input }),
    FH, FHN, STRIP,
    fhState: { locked: false, currentKey: key },
    successAnswer: (m) => { ctx.__r = { v: 'correct', m }; },
    failAnswer: (m) => { ctx.__r = { v: 'fail', m }; },
  };
  vm.createContext(ctx);
  vm.runInContext(saBody.replace('function submitAnswer()', 'ctxSubmit = function()'), ctx);
  vm.runInContext('ctxSubmit()', ctx);
  return ctx.__r || { v: 'none' };
}

const bracketLines = [];
for (const k of FH.keys) for (const s of (FH.lines[k] || [])) if (/[〔〕()]/.test(s)) bracketLines.push([k, s]);
L(`\nA5+ 含括号池条目总数=${bracketLines.length}`);
let pass3 = 0, fail3 = [];
for (const [k, s] of bracketLines) {
  const variants = [s, s.replace(/〔/g, '(').replace(/〕/g, ')'), STRIP(s)];
  const rs = variants.map(v => makeRunner(v, k));
  if (rs.every(r => r.v === 'correct')) pass3++;
  else fail3.push({ k, s, got: rs.map(r => r.v).join('/') });
}
L(`A5+ 三写法全判对条目=${pass3}/${bracketLines.length}`);
fail3.slice(0, 10).forEach(x => L('  未全对: ' + JSON.stringify(x).slice(0, 140)));

let plainPass = 0, plainTotal = 0, plainFail = [];
outer: for (const k of FH.keys) {
  for (const s of (FH.lines[k] || [])) {
    if (/[\s〔〕()（）]/.test(s)) continue;
    plainTotal++;
    const r = makeRunner(s, k);
    if (r.v === 'correct') plainPass++; else if (plainFail.length < 5) plainFail.push({ k, s, r });
    if (plainTotal >= 500) break outer;
  }
}
L(`A5+ 普通条目抽样原样输入判对=${plainPass}/${plainTotal}`);
plainFail.forEach(x => L('  普通条目意外: ' + JSON.stringify(x).slice(0, 140)));

let junkOk = 0, junkBad = [];
for (const k of FH.keys.slice(0, 50)) {
  const junk = k + '乱入的一句没有的话';
  const r = makeRunner(junk, k);
  if (r.v === 'fail' && /未收录/.test(r.m)) junkOk++; else junkBad.push({ k, r });
  if (junkOk + junkBad.length >= 20) break;
}
L(`A5+ 乱输入判未收录=${junkOk} 例，异常=${junkBad.length}（抽 20）`);
junkBad.slice(0, 5).forEach(x => L('  异常: ' + JSON.stringify(x).slice(0, 140)));

// ---- B6 tags 明细 ----
function findArrSpan(text, decl) {
  const i = text.indexOf(decl); let j = text.indexOf('[', i); const start = j;
  let depth = 0, inStr = 0, esc = false;
  for (; j < text.length; j++) {
    const c = text[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === inStr) inStr = 0; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') depth++; else if (c === ']') { depth--; if (depth === 0) return { start, end: j + 1 }; }
  }
}
const pP = findArrSpan(parent, 'const POEMS = [');
const POEMS_P = vm.runInNewContext('(' + parent.slice(pP.start, pP.end) + ')');
const tagLeaves = [];
POEMS_P.forEach(p => (p.tags || []).forEach((t, i) => { if (typeof t === 'string' && /[()]/.test(t)) tagLeaves.push({ id: p.id, title: p.title, tag: t }); }));
L(`\nB6+ tags 中含半角括号的叶子=${tagLeaves.length}`);
tagLeaves.forEach(x => L('  tag: ' + JSON.stringify(x).slice(0, 160)));

fs.writeFileSync('verify_supplement.txt', out.join('\n'), 'utf8');
console.log('DONE');
