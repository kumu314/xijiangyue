// 断言：小程序登录页「零收集」改造（#347 审核 3.4 驳回后的 A 方案）
// 被测目录可用 MP_DIR 环境变量覆盖（反向注入夹具）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MP = process.env.MP_DIR || 'D:/WorkBuddyData/WorkBuddy/2026-07-25-14-20-30/shiyun-miniprogram';
const read = (rel) => fs.readFileSync(path.join(MP, rel), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail === undefined ? '' : '  [' + detail + ']')); }
};

console.log('被测目录:', MP);
const wxml = read('pages/login/login.wxml');
const js = read('pages/login/login.js');
const wxss = read('pages/login/login.wxss');
const meWxml = read('pages/me/me.wxml');
const meJs = read('pages/me/me.js');
const appJs = read('app.js');

console.log('\n[A 组] 零收集：登录页不得出现任何个人信息采集入口');
ok('A1 无手机号 input 输入框', !/<input\b/i.test(wxml));
ok('A2 无「手机号」采集字样（允许「不收集手机号」否定声明）',
   !/请输入手机号|手机号登录|手机号验证码|手机号\s*<\/view>/.test(wxml) &&
   (/不收集手机号/.test(wxml) || !/手机号/.test(wxml)));
ok('A3 无「验证码」字样', !/验证码/.test(wxml));
ok('A4 无微信/QQ 第三方授权按钮文案', !/微信登录|QQ登录|一键授权/.test(wxml));
ok('A5 无 loginPhone / loginThird / onPhoneInput 绑定', !/loginPhone|loginThird|onPhoneInput/.test(wxml));
ok('A6 JS 无手机号正则校验 / phone 字段', !/\^1\\d\{10\}|phone:/.test(js));
ok('A7 JS 无 setUser 携带 phone / openid / provider', !/setUser\([^)]*(phone|openid|provider)/.test(js));
ok('A8 JS 无 cloudLogin 调用（登录页不拿 openid）', !/cloudLogin\s*\(/.test(js));
ok('A9 JS 无 requirePrivacyAuthorize 调用（零收集则无需触发授权弹窗）', !/requirePrivacyAuthorize/.test(js));
ok('A10 无第三方授权图标样式残留（.lt-wx / .lt-qq / .lic）', !/\.lt-wx|\.lt-qq|\.lic\b/.test(wxss));
ok('A11 无输入框样式残留（.lb-input）', !/\.lb-input\b/.test(wxss));

console.log('\n[B 组] 入口可用：一键本地进入，仍可回退');
ok('B1 有 bindtap 一键入口', /bindtap\s*=\s*"[^"]+"/.test(wxml), (wxml.match(/bindtap\s*=\s*"([^"]+)"/) || [])[1]);
ok('B2 有「开始」类引导文案', /开始使用|进入西江阅|开始赏读|直接进入/.test(wxml));
ok('B3 JS 有 startLocal / 本地入口函数', /startLocal\s*\(/.test(js));
ok('B4 入口调用 app.setUser 建立本地身份', /setUser\s*\(/.test(js));
ok('B5 本地身份仅含 type/name（无敏感字段）', /setUser\s*\(\s*\{\s*type\s*:\s*[^,]+,\s*name\s*:/.test(js));
ok('B6 保留 wx.switchTab 跳「我的」', /wx\.switchTab\s*\(\s*\{\s*url\s*:\s*'\/pages\/me\/me'/.test(js));

console.log('\n[C 组] 下游一致：me 页不再读 phone');
ok('C1 me.wxml 无 user.phone 引用', !/user\.phone/.test(meWxml));
ok('C2 me.js 仍可跳登录页', /pages\/login\/login/.test(meJs));
ok('C3 me.js 仍可登出（setUser(null)）', /setUser\s*\(\s*null\s*\)/.test(meJs));

console.log('\n[D 组] 启动无主动隐私弹窗（审核截图来源）');
ok('D1 app.js 移除主动 requirePrivacyAuthorize 调用', !/wx\.requirePrivacyAuthorize\s*\(/.test(appJs));
ok('D2 app.js 保留被动 onNeedPrivacyAuthorize 兜底', /wx\.onNeedPrivacyAuthorize\s*\(/.test(appJs));
ok('D3 app.js 无主动 getPrivacySetting 探测', !/wx\.getPrivacySetting\s*\(/.test(appJs));

console.log('\n' + '='.repeat(46));
console.log('结果: ' + pass + ' PASS / ' + fail + ' FAIL');
process.exit(fail > 0 ? 1 : 0);
