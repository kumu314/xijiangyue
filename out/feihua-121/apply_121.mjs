// #121 应用：飞花令池 6 处预存同 key 原始重复去重（保留首现、删次现）
// 手法：文本级精确删除——不重新序列化整段 JSON（避免键序/转义/空格漂移）
// 安全：逐元素扫描出每个元素的原文 span → 删目标 span + 一个相邻逗号 → 原地回写
// 断言：块外字节零变 / CRLF 0 / round-trip / 池 71710 / keys 49 / 同 key 重复 0 / 首现仍在
import { readFileSync, writeFileSync } from 'fs';
const FILE = 'D:/ZCode/小程序/xijiangyue/index.html';
const buf = readFileSync(FILE);
const text = buf.toString('utf8');

// 目标：key → 次现 idx（探针已实证：每组恰 2 次、次现 idx > 首现 idx、raw 串逐字节相同）
const TARGETS = { '秋': 1169, '柳': 1050, '清': 1231, '烟': 1124, '燕': 940, '声': 1130 };

const STRIP = s => s.replace(/[，。！？、；：「」''《》（）——…·〔〕()\[\]{}\s]/g, '');
const SCRIPT_RE = /<script type="application\/json" id="feihuaData">/;
const m = SCRIPT_RE.exec(text);
if (!m) throw new Error('feihuaData script 标签未找到');
const jsonStart = m.index + m[0].length;
const jsonEnd = text.indexOf('</script>', jsonStart);
const jsonText = text.slice(jsonStart, jsonEnd);

// —— 基线状态 ——
const base = JSON.parse(jsonText);
const baseKeys = Object.keys(base.lines);
let basePool = 0; for (const k of baseKeys) basePool += base.lines[k].length;
console.log('基线：池', basePool, '| keys', baseKeys.length);
if (basePool !== 71716 || baseKeys.length !== 49) throw new Error('基线不符预期，停止');

// —— 逐 key 断言：恰 2 次同 STRIP 串、次现 > 首现、raw 完全相同 ——
const plan = [];
for (const [key, dupIdx] of Object.entries(TARGETS)) {
  const arr = base.lines[key];
  const map = new Map();
  arr.forEach((s, i) => { const st = STRIP(s); if (!map.has(st)) map.set(st, []); map.get(st).push({ i, s }); });
  const dups = [...map.entries()].filter(([, v]) => v.length > 1);
  if (dups.length !== 1) throw new Error(key + ' 同 key 重复组数 = ' + dups.length + '（预期 1）');
  const [st, list] = dups[0];
  if (list.length !== 2) throw new Error(key + ' 重复次数 = ' + list.length + '（预期 2）');
  if (list[0].i >= list[1].i) throw new Error(key + ' 首现/次现顺序异常');
  if (list[0].s !== list[1].s) throw new Error(key + ' raw 串不相同，非纯重复');
  if (list[1].i !== dupIdx) throw new Error(key + ' 次现 idx = ' + list[1].i + '，与计划 ' + dupIdx + ' 不符');
  if (dupIdx >= arr.length) throw new Error(key + ' 次现 idx 越界');
  plan.push({ key, str: st, firstIdx: list[0].i, dupIdx, firstRaw: list[0].s, dupRaw: list[1].s, arrLen: arr.length });
}
console.log('探针：6 组断言全过（恰 2 次 / 次现>首现 / raw 相同）');

// —— 文本级定位：找该 key 在 lines 对象里的数组 span ——
function findArraySpan(t, key) {
  const marker = '"' + key + '":[';
  const i = t.indexOf(marker);
  if (i < 0) throw new Error('未找到 key 数组 ' + key);
  const open = i + marker.length - 1;
  // 扫到匹配的 ']'（尊重字符串字面量）
  let j = open + 1, inStr = false, esc = false;
  for (; j < t.length; j++) {
    const c = t[j];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (!inStr && c === ']') break;
  }
  return { open, close: j };
}
function elemSpans(t, open, close) {
  const elems = [];
  let i = open + 1;
  for (;;) {
    if (t[i] === ']') break;
    const s = i;
    if (t[i] === '"') {
      i++;
      for (;;) { if (t[i] === '\\') { i += 2; continue; } if (t[i] === '"') { i++; break; } i++; }
    } else {
      while (i < close && t[i] !== ',' && t[i] !== ']') i++;
    }
    elems.push({ s, e: i });
    if (t[i] === ',') { i++; continue; }
    break;
  }
  return elems;
}

// —— 生成删除区间（每个 key 内部只删 1 条）——
const cuts = [];
for (const p of plan) {
  const { open, close } = findArraySpan(jsonText, p.key);
  const elems = elemSpans(jsonText, open, close);
  if (elems.length !== p.arrLen) throw new Error(p.key + ' 元素数不一致：文本 ' + elems.length + ' vs JSON ' + p.arrLen);
  const k = p.dupIdx;
  let ds, de;
  if (k < elems.length - 1) { ds = elems[k].s; de = elems[k + 1].s; }   // 元素 + 其后逗号
  else { ds = elems[k - 1].e; de = elems[k].e; }                        // 其前逗号 + 元素
  cuts.push({ ...p, ds, de, absS: jsonStart + ds, absE: jsonStart + de, removed: jsonText.slice(ds, de) });
  console.log(`  ${p.key}: 删 idx ${k}「${p.dupRaw}」→ 移除文本 ${JSON.stringify(cuts[cuts.length - 1].removed)}`);
}
// 从后往前删，避免前面的 span 失效
cuts.sort((a, b) => b.ds - a.ds);
let newJson = jsonText;
for (const c of cuts) newJson = newJson.slice(0, c.ds) + newJson.slice(c.de);
const newText = text.slice(0, jsonStart) + newJson + text.slice(jsonEnd);

// —— 回写前断言 ——
if (/\r/.test(newText)) throw new Error('含 CR，CRLF 风格被破坏');
if (/\r/.test(text)) throw new Error('基线含 CR，需按 CRLF 风格处理');
const after = JSON.parse(newJson);
const afterKeys = Object.keys(after.lines);
let afterPool = 0; for (const k of afterKeys) afterPool += after.lines[k].length;
if (afterPool !== 71710) throw new Error('应用后池 = ' + afterPool + '（预期 71710）');
if (afterKeys.length !== 49) throw new Error('应用后 keys = ' + afterKeys.length);
if (JSON.stringify(afterKeys) !== JSON.stringify(baseKeys)) throw new Error('keys 序列变了');
// 同 key STRIP 重复 = 0
let dupLeft = 0;
for (const k of afterKeys) {
  const seen = new Set();
  for (const s of after.lines[k]) { const st = STRIP(s); if (seen.has(st)) dupLeft++; seen.add(st); }
}
if (dupLeft !== 0) throw new Error('应用后同 key 重复仍有 ' + dupLeft + ' 处');
// 首现仍在、次现已删
for (const p of plan) {
  const arr = after.lines[p.key];
  const n = arr.filter(s => s === p.firstRaw).length;
  if (n !== 1) throw new Error(p.key + ' 首现条目数 = ' + n + '（预期 1）');
  if (arr.length !== p.arrLen - 1) throw new Error(p.key + ' 数组长度未减 1');
}
// 块外零变（逐字节）：块前 / 块后两段必须与基线完全相同
const headSame = text.slice(0, jsonStart) === newText.slice(0, jsonStart);
const tailSame = text.slice(jsonEnd) === newText.slice(newText.length - (text.length - jsonEnd));
if (!headSame || !tailSame) throw new Error('块外字节发生变化');
// 差量 = 6 处删除文本长度之和
const removedBytes = cuts.reduce((s, c) => s + c.removed.length, 0);
if (text.length - newText.length !== removedBytes) throw new Error('字节差与移除量不符');

writeFileSync(FILE, newText, 'utf8');
console.log('=== 应用完成 ===');
console.log('字节', Buffer.byteLength(text, 'utf8'), '→', Buffer.byteLength(newText, 'utf8'), '（−' + (text.length - newText.length) + '）');
console.log('池', basePool, '→', afterPool, '| keys', afterKeys.length, '| 同 key 重复 → 0');
console.log('块外零变：head', headSame, '| tail', tailSame, '| CRLF 0 | round-trip OK');
