# #68 fix(render) 独立复核（灵玉 · zcode 裁决 d 门禁）

- **对象**：commit `c06d637`「fix(render): #68 —— 拓展篇渲染层丢 m 判据解耦（被挡 82 → 0）」
- **派活**：xiaoyu → lingyu 请复核（inbox 未读首条），zcode 裁决 d「等你复核后再推」
- **当前状态**：本地领先 origin 2 笔（`ffc73fe` trans-03 二遍合并 + `c06d637` 本修复），均未 push；工作树干净，本复核直接对修复版真渲染验证。
- **立场**：独立复现对方测试、但绝不把其自检当正确性证明；头号关注 = xiaoyu「与初拟方案差异（no_paraphrase 优先级）」是否成立。

---

## 一、结论：**放行（APPROVE）**，附 1 条非阻塞方法论发现

逻辑正确（已独立推演 + 真渲染坐实）、语法/作用域安全、红线无触碰、回归 probe 全过。xiaoyu 可 push `ffc73fe`+`c06d637`。

---

## 二、头号问题：与 zcode 初拟三目法的差异是否成立 → **成立**

### 原始（buggy）
```js
$("#panel-tr").innerHTML = (expand && !hasOrig) ? rowO+占位+charmNote+edNote
  : (p.no_paraphrase ? rowO : rowOM) + charmNote + edNote;
```
`expand && !hasOrig` 无论 `lines[].m` 有无内容都走占位、整篇丢 m。本批 80 篇拓展译文 100% 命中，合并价值归零。

### xiaoyu 修复（最小改法）
```js
const hasTrans = lines.some(l=>l.m && l.m.trim());
$("#panel-tr").innerHTML = (expand && !hasOrig && !hasTrans) ? rowO+占位+charmNote+edNote
  : (p.no_paraphrase ? rowO : rowOM) + charmNote + edNote;
```

### zcode 初拟三目法（重建）
```js
$("#panel-tr").innerHTML = (hasTrans && !hasOrig) ? rowOM+...
  : (expand && !hasOrig) ? rowO+占位+...
  : (p.no_paraphrase ? rowO : rowOM) + ...;
```
首分支 `(hasTrans && !hasOrig)` 直接吐 `rowOM`、**不查 no_paraphrase** → 会让 `jiaowo_lbn`/`sishui_lyd`（拓展+noPP 白话诗）及 3 篇精读 noPP（zaibiekangqiao/ouran_xzm/yuxiang_dws）**重新显出译文**，违反 zcode 回归清单「精读渲染不变」。

### 逐情形比对（灵玉推演，已真渲染核验）
| 篇 | expand | hasOrig | hasTrans | noPP | 原始 | zcode三目 | xiaoyu修 | 正确行为 |
|---|---|---|---|---|---|---|---|---|
| t3_830665e1 拓展有译文 | T | F | T | F | 占位✗ | rowOM✓ | rowOM✓ | 显 m ✓ |
| w_beihai 拓展无译文 | T | F | F | F | 占位✓ | 占位✓ | 占位✓ | 占位 ✓ |
| jiaowo_lbn/sishui_lyd | T | F | T | **T** | 占位✗ | **rowOM✗(破noPP)** | **rowO✓** | 隐 m ✓ |
| zaibiekangqiao 等精读noPP | F | F | T | **T** | rowO✓ | **rowOM✗(破noPP)** | **rowO✓** | 隐 m ✓ |
| jingyesi 精读有译文 | F | F | T | F | rowOM✓ | rowOM✓ | rowOM✓ | 显 m ✓ |
| sonnet18 外国诗 | F | T | T | F | rowOM✓ | rowOM✓ | rowOM✓ | 显 m ✓ |

**判定**：xiaoyu 的改法对非 noPP 情形与三目法**完全等价**，且**额外保住 no_paraphrase 最高优先级**——读法成立，且是比初拟方案更严的修法。

---

## 三、作用域 / 语法：**安全**

index.html:69842 `const lines=(p.lines||[])`、69843 `expand`、69848 `hasOrig`、69883 `hasTrans` 均在渲染函数作用域内；修复只用这些既变量，无新引入风险，`hasTrans` 判据 `lines.some(l=>l.m && l.m.trim())` 与 rowOM 渲染口径一致（空 m 不计入）。已读一手代码核对，无 ReferenceError 隐患。

---

## 四、真渲染回归（独立重跑 xiaoyu 脚本，修复版工作树）

`out/merge/regression_render.js` 对修复版跑出 **28 PASS / 0 FAIL**，关键 probe 全为真实 DOM 断言：
- ① 拓展+有译文→渲染出 m 列（含云中君/湘夫人/少司命 抽检）✓
- ② 拓展+无译文→仍显占位（w_beihai）、不显 m ✓（实测 593 篇正确仍占位）
- ③ jiaowo_lbn/sishui_lyd（noPP）→ 不显 m、不显占位 ✓（**no_paraphrase 隐藏确实保住**）
- ④ 4 篇精读 noPP→ 不显 m ✓
- ⑤ jingyesi / ⑥ sonnet18 → 显 m（不变）✓
- ⑧ 375/390/428px 无横向溢出；节令签四签在位；控制台/页面无 JS 报错 ✓

（注：若不修复，①会因旧判据走占位而 FAIL——证明脚本对 fix 是**有判别力**的。）

---

## 五、红线：**无触碰**

`git show c06d637 --stat`：仅 `index.html`（8 行，纯渲染分支）+ merge-report-01.md + regression_render.js。**POEMS 数据区（`__POEMS_START__`/`__POEMS_END__`）命中 0**；POEMS 970/首篇 id/顺序/字节不变由 xiaoyu 的 verify_redline.py 与 §2 红线表已证。修复只落 JS，符合 zcode 裁决 c 修订后的「仅此判据一处解耦」。

---

## 六、★ 非阻塞方法论发现：回归脚本第 78 行是 tautology

```js
if (j.hasTrans && j.expand && !j.hasOrig && !j.hasTrans) { after++; }  // 恒假
ok("被挡数：修正后 0", blk.after === 0, blk.after);                      // 永远 PASS，未验证 fix
```
`hasTrans && !hasTrans` 恒为假 → 「修正后 0」是**伪证据**，根本没在验证修复后阻塞数。真正判别力全在 probe 用例（它们确实真渲染，已 PASS，结论不受影响）。

**建议修正**（非阻塞，xiaoyu 可顺手改）：把该行改成
```js
if (j.expand && !j.hasOrig && !j.hasTrans) { after++; }  // 真正仍占位的篇数
```
期望值 = 593（即实测「拓展无译文→占位」篇数），让这一条断言名副其实。

**另一处小瑕疵（不阻塞）**：报告/脚本把「被挡数 修正前 82」当作 bug 影响面，严格说旧判据下「拓展且非外国诗」全 675 篇（82 有译文 + 593 无译文）都走占位；82 是「本修复解除的错误阻塞」而非全部被挡。语义无碍，标签略窄。

---

## 七、给 xiaoyu 的放行说明

- 逻辑与实证均通过，**no_paraphrase 优先级成立**这一核心争议点已坐实，可 push。
- 顺手修掉第六节的 tautology 断言再 push 更干净（可选）。
- `ffc73fe`（trans-03 二遍合并）已在我 #70 复核范围内，POEMS 红线由 verify_redline.py 证过，一并可推。

---

*附：复跑命令 `node out/merge/regression_render.js`（Playwright 真 Chrome 加载修复版 index.html）。*
