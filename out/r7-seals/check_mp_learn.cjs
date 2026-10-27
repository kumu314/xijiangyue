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
    // 以 - 结尾的是「前缀 + 插值」被抹掉后的半截（如 class="ck p-{{item.pl}}" → p-），
    // 它本来就不是完整类名，不该判缺失。
    .forEach(t => { if (CLS_T.test(t) && !/-$/.test(t)) used.add(t); });
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

// 7 打卡图标：对号圆已由「五清植物」取代（2026-10-27 枯木拍板）
//   未打卡＝枯灰下垂，打卡＝本色直立。颜色 + 姿态双信号，不只靠颜色区分状态。
const ckRule = (wxss.match(/^\.ck\s*\{[^}]*\}/m) || [''])[0];
ok('勾选圆已撤掉（无 50% 圆角 + 无边框）',
   !/border-radius:\s*50%/.test(ckRule) && !/border:/.test(ckRule), ckRule || '(缺 .ck 规则)');
ok('未打卡项不再靠 opacity 压暗（会把对比度再打一遍折）',
   !/\.ck\s*\{[^}]*opacity:/.test(wxss) && !/\.ci-item\s+\.ck[^{]*\{[^}]*opacity:/.test(wxss), null);

// 7.1 十张底色图：5 形 × 2 态，base64 必须能解出合法 SVG，且 currentColor 已换成本色
const COLORS = { mei:'#A6394F', lan:'#6A5A92', zhu:'#4E6B4A', ju:'#8A6220', song:'#2F5D45' };
const WILT = '#8F8577';
const bgRules = [...wxss.matchAll(/\.(?:ci-item\.done\s+)?\.?ck\.p-(\w+)\s*\{\s*background-image:\s*url\("data:image\/svg\+xml;base64,([^"]+)"\)/g)];
const parsed = bgRules.map(m => {
  const svg = Buffer.from(m[2], 'base64').toString('utf8');
  return { key: m[1], done: /ci-item\.done/.test(m[0]), svg };
});
ok('五清 × 两态 = 10 条背景图齐备', parsed.length === 10, parsed.map(p => (p.done ? '生:' : '枯:') + p.key).join(' '));
ok('每张图都是合法 SVG 且以 24×24 viewBox 为准',
   parsed.length === 10 && parsed.every(p => /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24">/.test(p.svg)), null);
ok('生成图里不再残留 currentColor（小程序无法继承文字色）',
   parsed.every(p => !/currentColor/.test(p.svg)), null);
const colorOk = Object.entries(COLORS).every(([k, c]) => {
  const won = parsed.find(p => p.key === k && !p.done);
  const don = parsed.find(p => p.key === k && p.done);
  return won && don && won.svg.includes(WILT) && don.svg.includes(c);
});
ok('枯态统一 #8F8577、生长期各是本项本色（梅红/兰紫/竹青/菊金/松绿）', colorOk,
   Object.keys(COLORS).join(','));
ok('未打卡态带下垂姿态（rotate(-9deg)）', /rotate\(-9deg\)/.test(wxss), null);
ok('完成态回正（rotate(0)）', /\.ci-item\.done \.ck \{[^}]*rotate\(0\)/.test(wxss), null);
ok('打卡那一刻有抽芽动效 plantBloomMp', /@keyframes plantBloomMp/.test(wxss) && /animation:\s*plantBloomMp/.test(wxss), null);

// 7.2 WXML 接的必须是植物类名，不是写死的字符
ok('WXML 用 p-{{item.pl}} 挂植物类名', /class="ck p-\{\{\s*item\.pl\s*\}\}"/.test(wxml), null);
ok('WXML 不再输出 ✓ 字符（对号已撤）', !/>\s*✓\s*</.test(wxml) && !/\?\s*'✓'/.test(wxml), null);

// 8 印文必须是真汉字：WXML 里印位内容是 {{item.se}}（单字），不是手绘 svg/path 冒充字形。
const stampM = wxml.match(/class="stamp[^"]*"[^>]*>([^<]*)</);
ok('印位内容是单个真汉字 {{item.se}}（非手绘 svg/path 冒充）',
   !!stampM && /\{\{\s*item\.se\s*\}\}/.test(stampM[1]) && !/<(svg|path|img)/i.test(stampM[1]),
   stampM && stampM[1]);
const seVal = [...js.matchAll(/se:\s*'([^']*)'/g)].map(m => m[1]);
ok('每个打卡项的印字都是 1 个汉字（小程序现为 5 项）',
   seVal.length === 5 && seVal.every(s => /^[\u4e00-\u9fff]$/.test(s)), seVal);

// 9 第 5 项「每日温故」补齐 + 满勤口径必须排除它（与桌面同一套 noStreak 陷阱）
const plVal = [...js.matchAll(/pl:\s*'(\w+)'/g)].map(m => m[1]);
ok('5 个打卡项都绑了植物（pl 字段）', plVal.length === 5 && plVal.join(',') === 'mei,lan,zhu,ju,song', plVal);
ok('存在 STREAK_ITEMS = ITEMS 过滤 noStreak', /const STREAK_ITEMS = ITEMS\.filter\(it => !it\.noStreak\)/.test(js), null);
ok('温故项标了 noStreak + wide', /key: 'review'[^}]*noStreak: true[^}]*wide: true/.test(js), null);
ok('满勤判定用 STREAK_ITEMS（不得用 ITEMS.every，否则 4/5 会误报满勤）',
   /const allDone = STREAK_ITEMS\.every/.test(js) && !/const (allDone|wasAll|nowAll) = ITEMS\.every/.test(js), null);
ok('差几项的提示也只数 4 项（leftN 用 STREAK_ITEMS）',
   /const leftN = STREAK_ITEMS\.filter/.test(js), null);
ok('满勤文案写明「四项」，避免「4/5 · 满勤」自相矛盾',
   /今日诗词四项已满勤/.test(js), null);
ok('第五项独占整行（.ci-item.wide 宽度 100%）', /\.ci-item\.wide\s*\{[^}]*width:\s*100%/.test(wxss), null);

// 10 口径实算：把 learn.js 的判定逻辑抽出来跑三种情形（不信「看着对」，直接算）
const doneOf = ks => ks.reduce((o, k) => (o[k] = true, o), {});
const allDoneWith = d => STREAK.every(k => d[k]);
const STREAK = ['read', 'watch', 'know', 'memory'];
const cases = [
  ['只勾 4 项（不含温故）→ 满勤', true, allDoneWith(doneOf(STREAK))],
  ['勾满 5 项（含温故）→ 仍是满勤', true, allDoneWith(doneOf([...STREAK, 'review']))],
  ['勾了温故但缺「记」→ 不满勤', false, allDoneWith(doneOf(['read', 'watch', 'know', 'review']))]
];
ok('满勤口径实算三例', cases.every(c => c[1] === c[2]),
   cases.map(c => c[0] + '=' + (c[2] ? '满勤' : '不满')).join(' | '));

console.log(fail ? '\nMP-RESULT fail=' + fail : '\nMP-RESULT all pass');
process.exit(fail ? 1 : 0);
