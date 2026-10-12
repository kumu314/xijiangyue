// 独立复核 #111：xijiangyue #4/#5（STRIP 纳入 + POEMS 68 处括号统一）——完整复算脚本 v2
// 数据源只用 git show 取出的两版原始文件（parent_index.html / target_index.html），不读工作区。
const fs = require('fs');
const vm = require('vm');
const cp = require('child_process');
const REPO = 'D:/ZCode/小程序/xijiangyue';

const parentRaw = fs.readFileSync('parent_index.html');
const targetRaw = fs.readFileSync('target_index.html');
const parent = parentRaw.toString('utf8');
const target = targetRaw.toString('utf8');
const out = [];
const L = (s) => { out.push(String(s)); };

// ---------- 区域切分 ----------
function findArrSpan(text, decl) {
  const i = text.indexOf(decl);
  if (i < 0) throw new Error('未找到 ' + decl);
  let j = text.indexOf('[', i);
  const start = j;
  let depth = 0, inStr = 0, esc = false;
  for (; j < text.length; j++) {
    const c = text[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === inStr) inStr = 0;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return { start, end: j + 1 }; }
  }
  throw new Error(decl + ' 括号未配平');
}
const pP = findArrSpan(parent, 'const POEMS = [');
const tP = findArrSpan(target, 'const POEMS = [');
function jsonBlockSpan(text) {
  const s = text.indexOf('<script type="application/json" id="feihuaData">');
  const e = text.indexOf('</scr' + 'ipt>', s);
  return { start: s, end: e };
}
const pF = jsonBlockSpan(parent);
const tF = jsonBlockSpan(target);
const lineOf = (text, off) => text.slice(0, off).split('\n').length - 1;

L('=== 区域定位 ===');
L(`POEMS 行区间(0-based): parent[${lineOf(parent, pP.start)}..${lineOf(parent, pP.end)}] target[${lineOf(target, tP.start)}..${lineOf(target, tP.end)}]`);
L(`feihuaData 块行区间: parent[${lineOf(parent, pF.start)}..${lineOf(parent, pF.end)}] target[${lineOf(target, tF.start)}..${lineOf(target, tF.end)}]`);

// ---------- A1/B8: diff hunk 落区 + 分段逐字节 ----------
L('\n=== A1/B8 改动面 ===');
const diff = cp.execSync(`git -C "${REPO}" diff -U0 97bb09b 7dc2848 -- index.html`, { maxBuffer: 1 << 30, encoding: 'utf8' });
const hunks = diff.split('\n').filter(l => l.startsWith('@@')).map(l => {
  const m = l.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  return { a: +m[1], ac: m[2] === undefined ? 1 : +m[2], b: +m[3], raw: l };
});
function jsSpan(text) {
  const s = text.indexOf('const STRIP =');
  const e = text.indexOf('function submitAnswer');
  const e2 = text.indexOf('\n}', e) + 2;
  return { s: lineOf(text, s), e: lineOf(text, e2), cs: s, ce: e2 };
}
const tJS = jsSpan(target), pJS = jsSpan(parent);
L(`STRIP~submitAnswer 行区间: parent[${pJS.s}..${pJS.e}] target[${tJS.s}..${tJS.e}]`);
const PL = { s: lineOf(target, tP.start), e: lineOf(target, tP.end) };
let hPOEMS = 0, hJS = 0, hOther = [];
for (const h of hunks) {
  const ln = h.b - 1;
  if (ln >= PL.s && ln <= PL.e) hPOEMS++;
  else if (ln >= tJS.s && ln <= tJS.e) hJS++;
  else hOther.push(h.raw + ` -> target行${ln}`);
}
L(`hunks=${hunks.length} 落POEMS=${hPOEMS} 落JS段=${hJS} 其他=${hOther.length}`);
hOther.forEach(x => L('  !!其他落区: ' + x));
L(`A1 feihuaData 块两版逐字节相同: ${parent.slice(pF.start, pF.end) === target.slice(tF.start, tF.end)}`);
// 分段：POEMS 前 / POEMS 内(允许差) / POEMS后~STRIP前 / JS段(允许差) / submitAnswer后
const segs = [
  ['文件头~POEMS前', 0, pP.start, 0, tP.start],
  ['POEMS后~STRIP前', pP.end, pJS.cs, tP.end, tJS.cs],
  ['submitAnswer后~EOF', pJS.ce, parent.length, tJS.ce, target.length],
];
for (const [name, a1, a2, b1, b2] of segs) {
  L(`B8 段[${name}] 逐字节相同: ${parent.slice(a1, a2) === target.slice(b1, b2)} (长度 ${a2 - a1}/${b2 - b1})`);
}

// ---------- A2 字符类 ----------
L('\n=== A2 STRIP 字符类 ===');
const stripSrcOf = (t) => t.match(/const STRIP = (.*)\n/)[1];
const pSrc = stripSrcOf(parent), tSrc = stripSrcOf(target);
L('parent: ' + pSrc);
L('target: ' + tSrc);
const mk = (src) => vm.runInNewContext('(' + src.replace(/;\s*$/, '') + ')');
const pSTRIP = mk(pSrc), tSTRIP = mk(tSrc);
const clsOf = (src) => src.match(/\[([^\]]*)\]/)[1];
const tCls = clsOf(tSrc), pCls = clsOf(pSrc);
L(`目标类含〔=${tCls.includes('〔')} 〕=${tCls.includes('〕')} 半角(=${tCls.includes('(')} 半角)=${tCls.includes(')')} 全角（=${tCls.includes('（')} 全角）=${tCls.includes('）')}`);
L(`父版含〔或( = ${pCls.includes('〔') || pCls.includes('(')}（应为 false，父版未纳入）`);

// ---------- A3 FHN / submitAnswer ----------
L('\n=== A3 池侧归一化 ===');
const fhnRe = /const FHN = \{\}; for\(const k of FH\.keys\) FHN\[k\] = \(FH\.lines\[k\]\|\|\[\]\)\.map\(STRIP\);/;
L('FHN 定义与任务书要求逐字匹配: ' + fhnRe.test(target));
const saText = target.slice(tJS.cs, tJS.ce);
L(`submitAnswer 用 FHN[key]=${/const pool = FHN\[key\]/.test(saText)}; 不含 FH.lines=${!/FH\.lines/.test(saText)}`);

// ---------- FH 池数据（A4/A5） ----------
const fhJson = target.slice(tF.start, tF.end).replace(/^<script[^>]*>\s*/, '');
const FH = JSON.parse(fhJson);
const allLines = [];
for (const k of FH.keys) for (const s of (FH.lines[k] || [])) allLines.push(s);
L('\n=== A4 池侧可达性 ===');
L(`池总条数=${allLines.length.toLocaleString('en-US')} (任务书分母 72,422)`);
const hitNew = allLines.filter(s => /[〔〕()]/.test(s));
const hitFullOld = allLines.filter(s => Array.from(s).some(ch => pCls.includes(ch) && !'〔]()'.includes(ch) && ch !== ' ' && !/\s/.test(ch)));
const anyStripChar = (s, cls) => Array.from(s).some(ch => cls.includes(ch) || /\s/.test(ch));
const hitAnyOld = allLines.filter(s => anyStripChar(s, pCls));
const hitAnyNew = allLines.filter(s => anyStripChar(s, tCls));
L(`含〔〕或半角()的条目=${hitNew.length.toLocaleString('en-US')}（其中含〔〕=${allLines.filter(s => /[〔〕]/.test(s)).length}，含半角()=${allLines.filter(s => /[()]/.test(s)).length}）`);
L(`含"父版STRIP会剥的字符"的条目=${hitAnyOld.length.toLocaleString('en-US')}（任务书 A4 期望 0）`);
L(`含"新版STRIP会剥的字符"的条目=${hitAnyNew.length.toLocaleString('en-US')}`);
const uniqBefore = new Set(allLines).size;
const uniqAfter = new Set(allLines.map(tSTRIP)).size;
L(`去重数 归一化前=${uniqBefore.toLocaleString('en-US')} 后=${uniqAfter.toLocaleString('en-US')}（任务书期望 59,087 → 59,087）`);
// 不可达判据：FHN 构造保证 STRIP(池内条目) 在池内；反证：若父版(池不归一化)下检查
// 父版行为：比对 STRIP(input)===池原串。含被剥字符的池条目，其自身 STRIP 后不等于原串 →
// 只有输入恰为原串才命中；输入"省略括号写法"不命中 ⇒ 这些条目对省略写法不可达。
const unreachableParent = allLines.filter(s => pSTRIP(s) !== s).length;
const unreachableTarget = allLines.filter(s => tSTRIP(s) !== s).length;
L(`父版下"省略括号输入不可达"条目=${unreachableParent.toLocaleString('en-US')}；新版(FHN)下=${0}（FHN 定义保证，另由 A5 实测）`);

// ---------- A5 行为（在 vm 里真调 submitAnswer） ----------
L('\n=== A5 submitAnswer 真实调用（vm 桩，不转述） ===');
function runSubmitAnswer(version, key, input) {
  const src = version === 'target' ? target : parent;
  const js = jsSpan(src);
  const ctx = {
    document: { getElementById: () => ({ textContent: fhJson }) },
    FH: JSON.parse(fhJson),
    $: (sel) => sel === '#fhInput' ? { value: input } : null,
    toast: () => {},
    fhState: { locked: false, currentKey: key },
    successAnswer: (m) => { ctx.__result = { verdict: 'correct', matched: m }; },
    failAnswer: (m) => { ctx.__result = { verdict: 'fail', msg: m }; },
    clearInterval: () => {},
  };
  vm.createContext(ctx);
  // 目标版取 STRIP~submitAnswer 段（含 FHN）；父版同段（父版 submitAnswer 用 FH.lines）
  const code = src.slice(src.indexOf('const STRIP ='), src.indexOf('function submitAnswer') >= 0 ? js.ce : -1);
  vm.runInContext(code, ctx);
  vm.runInContext('submitAnswer()', ctx);
  return ctx.__result || { verdict: 'none' };
}
// 选一条含〔〕的池条目做三写法测试
const sample = hitNew.length ? hitNew[0] : null;
if (sample) {
  const key = FH.keys.find(k => (FH.lines[k] || []).includes(sample));
  const bare = tSTRIP(sample); // 省略括号写法
  const full = sample;         // 原样〔〕
  const half = sample.replace(/〔/g, '(').replace(/〕/g, ')');
  L(`样本条目: ${JSON.stringify(sample)} (key=${key})`);
  for (const [name, inp] of [['原样〔〕', full], ['半角()', half], ['省略括号', bare]]) {
    const rT = runSubmitAnswer('target', key, inp);
    const rP = runSubmitAnswer('parent', key, inp);
    L(`  输入[${name}] => 新版:${rT.verdict === 'correct' ? '判对' : '判错/' + (rT.msg || '')} | 父版:${rP.verdict === 'correct' ? '判对' : '判错/' + (rP.msg || '')}`);
  }
  // 乱输入仍判未收录
  const junk = key + '不存在的乱句xyz';
  const rJ = runSubmitAnswer('target', key, junk);
  L(`  乱输入(含关键字) => ${rJ.verdict === 'fail' ? '判未收录✔: ' + rJ.msg : '意外:' + rJ.verdict}`);
} else {
  L('池中无含括号条目，三写法测试不适用');
}

// ---------- POEMS 解析（B6-B10） ----------
const POEMS_P = vm.runInNewContext('(' + parent.slice(pP.start, pP.end) + ')');
const POEMS_T = vm.runInNewContext('(' + target.slice(tP.start, tP.end) + ')');
L('\n=== B6-B10 POEMS ===');
function leaves(arr) {
  const res = [];
  const walk = (node, path, poemId) => {
    if (typeof node === 'string') { res.push({ path, val: node, poem: poemId }); return; }
    if (Array.isArray(node)) { node.forEach((x, i) => walk(x, path + '[]', poemId)); return; }
    if (node && typeof node === 'object') { for (const k of Object.keys(node)) walk(node[k], path ? path + '.' + k : k, poemId); }
  };
  arr.forEach(p => walk(p, '', p.id));
  return res;
}
const lp = leaves(POEMS_P), lt = leaves(POEMS_T);
const halfIn = (s) => /[()]/.test(s);
const pHalf = lp.filter(x => halfIn(x.val));
L(`B6 父版带半角括号字符串叶子=${pHalf.length} (任务书期望 68)，其中 lines[].o=${pHalf.filter(x => /\.o$|\[\]\.o$/.test(x.path) || x.path.endsWith('.o')).length}`);
const uniqStr = new Set(pHalf.map(x => x.val)).size;
L(`   唯一串=${uniqStr} (期望 67)，涉及篇数=${new Set(pHalf.map(x => x.poem)).size} (期望 64)`);
const byField = {};
for (const x of pHalf) { const f = x.path.replace(/\[\]/g, '[]'); byField[f] = (byField[f] || 0) + 1; }
L('   字段分布: ' + JSON.stringify(byField));
// B7 剥括号逐字比对
const norm = (s) => s.replace(/[〔〕()（）]/g, '');
const idxT = new Map(lt.map((x, i) => [x.path + '#' + i, x]));
let b7fail = 0, b7ex = [];
if (lp.length !== lt.length) { L(`B7 叶子总数不等! ${lp.length} vs ${lt.length}`); b7fail++; }
else {
  for (let i = 0; i < lp.length; i++) {
    if (lp[i].path !== lt[i].path || lp[i].poem !== lt[i].poem) { b7fail++; if (b7ex.length < 3) b7ex.push('结构错位@' + i); continue; }
    if (norm(lp[i].val) !== norm(lt[i].val)) { b7fail++; if (b7ex.length < 5) b7ex.push(lp[i].path + ' ' + lp[i].val.slice(0, 40) + ' => ' + lt[i].val.slice(0, 40)); }
  }
}
L(`B7 剥括号后逐字相同: ${b7fail === 0} (不一致处=${b7fail})`);
b7ex.forEach(e => L('   例: ' + e));
// 只有半角->全角方向的改动
const changed = [];
for (let i = 0; i < lp.length; i++) if (lp[i].val !== lt[i].val) changed.push({ p: lp[i], t: lt[i] });
L(`实际改动叶子数=${changed.length}`);
const bad = changed.filter(c => !halfIn(c.p.val) || norm(c.p.val) !== norm(c.t.val) || !/[（）]/.test(c.t.val));
L(`B7 改动全部为"半角()→全角（）"且只此一项: ${bad.length === 0} (违规=${bad.length})`);
bad.slice(0, 5).forEach(c => L('   违规例: ' + c.p.path + ' ' + c.p.val + ' => ' + c.t.val));
// lines[].o 不许被动
const oChanged = changed.filter(c => c.p.path.endsWith('.o'));
L(`B6 红线 lines[].o 被改动数=${oChanged.length} (期望 0)`);
// B9 红线
L(`B9 篇数 target=${POEMS_T.length} (期望 935)`);
const idSame = POEMS_P.every((p, i) => p.id === POEMS_T[i].id);
L(`B9 id 序逐位相同: ${idSame}`);
L(`B9 文件 CRLF 数: parent=${parentRaw.includes('\r\n') ? (parentRaw.toString('binary').match(/\r\n/g) || []).length : 0} target=${targetRaw.includes('\r\n') ? (targetRaw.toString('binary').match(/\r\n/g) || []).length : 0} (期望 0)`);
const residual = lt.filter(x => halfIn(x.val) && !x.path.endsWith('.o'));
L(`B9 改后非 o 字段半角括号残留=${residual.length} (期望 0)`);
residual.slice(0, 5).forEach(x => L('   残留例: ' + x.poem + ' ' + x.path + ' ' + x.val.slice(0, 50)));
// B10 连带面：68 条原串是否出现在 feihuaData 池
const inPool = new Set(allLines);
const leaked = changed.filter(c => inPool.has(c.p.val) || inPool.has(c.t.val));
L(`B10 改动串(原/新形态)出现在 FH 池的条数=${leaked.length} (期望 0)`);
leaked.slice(0, 5).forEach(c => L('   泄漏例: ' + c.p.val.slice(0, 50)));
// 同时按子串粗查
const leakSub = changed.filter(c => fhJson.includes(c.p.val)).map(c => c.p.val.slice(0, 40));
L(`B10 原串作为子串出现在 feihuaData 文本的条数=${leakSub.length}`);
leakSub.slice(0, 8).forEach(s => L('   子串例: ' + s));

fs.writeFileSync('verify_results.txt', out.join('\n'), 'utf8');
console.log('DONE items=' + out.length);
