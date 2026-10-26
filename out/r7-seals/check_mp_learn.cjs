// 小程序 learn 页静态体检：WXML 标签闭合 / 类名是否有定义 / 绑定的方法是否存在 / 数据键是否声明
const fs = require('fs');
const P = 'D:/WorkBuddyData/WorkBuddy/2026-07-25-14-20-30/shiyun-miniprogram/';
const wxml = fs.readFileSync(P + 'pages/learn/learn.wxml', 'utf8');
const wxss = fs.readFileSync(P + 'pages/learn/learn.wxss', 'utf8');
const js = fs.readFileSync(P + 'pages/learn/learn.js', 'utf8');
const appwxss = fs.readFileSync(P + 'app.wxss', 'utf8');

let fail = 0;
const ok = (n, c, x) => { console.log((c ? '  PASS ' : '  FAIL ') + n + (x !== undefined && !c ? '  → ' + JSON.stringify(x) : '')); if (!c) fail++; };

// 1 标签闭合（忽略自闭合与 block）
const tags = [...wxml.matchAll(/<\/?([a-zA-Z-]+)([^>]*?)(\/?)>/g)];
const stack = [];
let bad = [];
for (const m of tags) {
  const name = m[1], close = m[0].startsWith('</'), self = m[3] === '/';
  if (self) continue;
  if (close) { const top = stack.pop(); if (top !== name) bad.push({ expect: top, got: name }); }
  else stack.push(name);
}
ok('WXML 标签闭合平衡', bad.length === 0 && stack.length === 0, { bad, left: stack });

// 2 类名：WXML 里用到的 class 必须在本页 WXSS 或 app.wxss 里有定义（动态类已展开）
// 口径说明（2026-10-26 修）：上一版有两个误报源 ——
//   ① 对 class="..." 直接按空白分词，{{ item.done ? 'done' : '' }} 会切出 ? : === 等碎片；
//   ② 另有一处全文件 /'([a-z0-9-]+)'/ 扫描，把 JS 表达式里任何单引号串都当类名。
// 现在只在【class 属性内部】取类名，并分两步：先取 {{}} 里的字符串字面量，再取抹掉 {{}} 后的静态词。
// 合法类名形如 [A-Za-z][\w-]*，天然排除 ? : === item.key 这类碎片。
// 注意：不要收紧成纯小写 —— 那样 {{a ? 'Foo' : ''}} 里的大写类会被静默丢掉，
// 判据就退化成「查不到 = 没问题」（已用反向注入对照验过，见 LESSONS.md）。
const CLS_T = /^[A-Za-z][\w-]*$/;
const used = new Set();
const clsAttrs = [...wxml.matchAll(/class="([^"]*)"/g)].map(m => m[1]);
for (const val of clsAttrs) {
  // 2.1 动态部分：{{ cond ? 'done' : '' }} → done
  for (const ex of [...val.matchAll(/\{\{([\s\S]*?)\}\}/g)].map(m => m[1])) {
    for (const lit of [...ex.matchAll(/'([^']*)'/g)].map(m => m[1])) {
      lit.split(/\s+/).forEach(t => { if (CLS_T.test(t)) used.add(t); });
    }
  }
  // 2.2 静态部分：抹掉 {{...}} 后按空格分词
  val.replace(/\{\{[\s\S]*?\}\}/g, ' ')
    .split(/\s+/)
    .forEach(t => { if (CLS_T.test(t)) used.add(t); });
}
const defined = new Set();
[wxss, appwxss].forEach(src => { [...src.matchAll(/\.([a-zA-Z][\w-]*)/g)].forEach(m => defined.add(m[1])); });
const missing = [...used].filter(c => !defined.has(c));
ok('WXML 用到的类名都有样式定义', missing.length === 0, missing);

// 3 事件绑定的方法必须在 Page({}) 里存在
const handlers = [...new Set([...wxml.matchAll(/bind:?(\w+)="(\w+)"/g)].map(m => m[2]))];
const methods = [...js.matchAll(/^\s{2}(\w+)\s*\(/gm)].map(m => m[1]);
const noHandler = handlers.filter(h => !methods.includes(h));
ok('bindtap 等方法均已实现', noHandler.length === 0, { handlers, noHandler });

// 4 WXML 引用的数据键必须在 data 初值里出现
const keys = new Set([...wxml.matchAll(/\{\{\s*([a-zA-Z_]\w*)/g)].map(m => m[1]));
const dataBlock = (js.match(/data:\s*\{([\s\S]*?)\n  \},/) || [])[1] || '';
const declared = new Set([...dataBlock.matchAll(/([a-zA-Z_]\w*)\s*:/g)].map(m => m[1]));
const local = new Set(['item', 'index', 'true', 'false']);   // wx:for 局部变量
const noData = [...keys].filter(k => !declared.has(k) && !local.has(k));
ok('模板引用的数据键都已在 data 声明', noData.length === 0, noData);

// 5 keyframes 引用完整
const animNames = [...new Set([...wxss.matchAll(/animation(?:-name)?:\s*([\w-]+)/g)].map(m => m[1]).filter(n => !/^\.?\d/.test(n)))];
const keyframes = new Set([...wxss.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]));
const noKf = animNames.filter(n => !keyframes.has(n) && !/^(none|both|ease)/.test(n));
ok('animation 引用的 keyframes 都已定义', noKf.length === 0, { animNames, noKf });

// 6 触觉与文案
ok('使用 wx.vibrateShort 轻震（拍板③）', /wx\.vibrateShort\(\{\s*type:\s*'light'/.test(js), null);
ok('已移除完成时的 toast 打断', !/wx\.showToast/.test(js), null);
ok('取消不触发震动（奖励感只给完成）', /if\s*\(c\.done\[key\]\)\s*\{\s*\n\s*try\s*\{\s*wx\.vibrateShort/.test(js), null);
ok('完成态不再用玉绿（淡墨收敛）', !/rgba\(110,139,106/.test(wxss), null);
ok('满勤卷存在且有 keyframes 驱动', /ci-scroll\.on/.test(wxss) && /coda/.test(js), null);

console.log(fail ? '\nMP-RESULT fail=' + fail : '\nMP-RESULT all pass');
process.exit(fail ? 1 : 0);
