// 灵玉 2026-10-12 · #110 逻辑级冒烟：直接复用 index.html 内真实的 STRIP / feihuaData 代码求值
// 不重实现正则，不重实现池；只做「归一化后能否命中」的判定。
import fs from "node:fs";

const P = "D:/ZCode/小程序/xijiangyue/index.html";
const txt = fs.readFileSync(P, "utf8");

// 1) 取出真实 STRIP 定义并求值
const mStrip = txt.match(/const STRIP\s*=\s*s\s*=>[^\n]*/);
if (!mStrip) { console.error("FAIL: 未找到 STRIP"); process.exit(1); }
console.log("STRIP 原文 :", mStrip[0]);
const STRIP = eval(mStrip[0].replace(/^const STRIP\s*=/, ""));

// 2) 取出真实 feihuaData 字面量并求值
// 与页面同路径：<script type="application/json" id="feihuaData"> … </script>，FH = JSON.parse(...)
const mTag = txt.match(/<script type="application\/json" id="feihuaData">([\s\S]*?)<\/script>/);
if (!mTag) { console.error("FAIL: 未找到 feihuaData script 块"); process.exit(1); }
const FH = JSON.parse(mTag[1]);
console.log("池来源     : feihuaData script 块 | keys =", FH.keys.length);

// 3) 按页面内同样方式建归一化池
const FHN = {};
for (const k of FH.keys) FHN[k] = (FH.lines[k] || []).map(STRIP);

// 4) 20 条被补括号的条目（改后形态）
const fixed = [
  ["云","〔云〕两日不见便病的这般瘦了"],["云","〔云〕便好道筵前无乐"],
  ["云","〔云〕刘封那里去"],["云","〔云〕妾身乃王安石夫人也"],
  ["云","〔云〕我替你说过了也"],["云","〔云〕报报"],
  ["云","〔云〕是谁打我来"],["云","〔云〕老相公"],
  ["云","〔正末云〕小娘子金钗坠也"],["云","〔正末云〕若主公不听赵云谏当呵"],
  ["云","〔正末唱〕报一声金钗斜坠乌云上"],["云","〔王云〕你这十数个家乐侍女"],
  ["人","〔云〕妾身乃王安石夫人也"],["声","〔正末唱〕报一声金钗斜坠乌云上"],
  ["日","〔云〕两日不见便病的这般瘦了"],["松","〔撞松科〕〔布袋上〕"],
  ["白","〔望白科〕"],["酒","〔与众把酒科〕"],
  ["金","〔正末云〕小娘子金钗坠也"],["金","〔正末唱〕报一声金钗斜坠乌云上"],
];

let pass = 0, fail = 0;
const rows = [];
for (const [k, full] of fixed) {
  const bare = full.replace(/[〔〕]/g, "");
  const half = full.replace(/〔/g, "(").replace(/〕/g, ")");
  const inFull = (FH.lines[k] || []).includes(full);              // 池内确有该条目
  const hitFull = (FHN[k] || []).indexOf(STRIP(full)) >= 0;        // 全角输入
  const hitHalf = (FHN[k] || []).indexOf(STRIP(half)) >= 0;        // 半角输入
  const hitBare = (FHN[k] || []).indexOf(STRIP(bare)) >= 0;        // 无括号输入
  const ok = inFull && hitFull && hitHalf && hitBare;
  ok ? pass++ : fail++;
  rows.push(`${ok ? "PASS" : "FAIL"} ${k} 池内=${inFull} 全角=${hitFull} 半角=${hitHalf} 无括号=${hitBare} | ${full}`);
}
rows.forEach(r => console.log(r));
console.log(`\n结果: ${pass}/${fixed.length} PASS，${fail} FAIL`);

// 5) 全池不配对复算（独立口径）
let bad = 0;
for (const k of FH.keys) for (const s of (FH.lines[k] || []))
  if (s.count ? false : (s.split("〔").length !== s.split("〕").length || s.includes("(") || s.includes(")"))) bad++;
console.log("全池不配对条目:", bad);
console.log("全池半角括号条目:", FH.keys.reduce((n,k)=>n+(FH.lines[k]||[]).filter(s=>s.includes("(")||s.includes(")")).length,0));
process.exit(fail === 0 && bad === 0 ? 0 : 1);
