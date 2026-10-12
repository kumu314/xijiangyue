# #113 阶段二报告 · 3 处 lead 摘录修复（已落盘，待 commit）

> 任务：`xijiangyue-lead-excerpt-3-fix`（灵玉派）｜ 执行：小羽 ｜ 日期：2026-10-12
> 枯木裁定：**`w_xingzhe` 走路二 + 批准阶段二**。阶段一只读见 `review-lead-excerpt-113-phase1-20261012.md`。

---

## 〇、基线（阶段二动手前 git status 复核）

- HEAD = **`f3f6297`**（非 `faa73cb`，#112 后叠的 2 笔 docs-only 之末）；index.html 改前 sha256 = **`8dcbf53f…`**（与 `git show faa73cb:index.html` 逐字节一致，实质基线未变）。
- 三处目标子串均唯一（count=1）、改后串均不存在（count=0）、`w_harold` 先例证实摘录内含逗号合法。

---

## 一、3 处改动（枯木定：A 类去括号 + B 类 w_xingzhe 路二）

| id | 类 | `story.lead` 摘录 改前 | 改后 |
|---|---|---|---|
| `t3_ee654ae8`（马嵬坡） | A 括号残留 | `以「[玄]宗回马」开篇` | `以「玄宗回马」开篇` |
| `t3_1f9fe6fc`（自夏口至鹦鹉洲…） | A 括号残留 | `以「[汀]洲无浪」开篇` | `以「汀洲无浪」开篇` |
| `w_xingzhe`（外国诗·行者） | B 真缺陷·**路二** | `以「travel」开篇` | `以「旅人，你的脚印」开篇` |

> `w_xingzhe` 路二 = 首句 `旅人，你的脚印是唯一的路，` 去标点前 6 字窗口（外国诗体例，众数 6 字），非中国诗「首句到首个标点」孤例。
> 改动仅 `story.lead` 的「以…开篇」摘录子串；title/author/正文/ed/串讲零动。

---

## 二、落盘自证（fix_113.py，--write 前全断言）

| 断言 | 结果 |
|---|---|
| 三处 old 子串全库唯一 | ✅ count=1 |
| 三处 new 子串改前不存在 | ✅ count=0 |
| POEMS 区除 3 处外逐字节不变 | ✅ `region_check==region_new` |
| POEMS 区间外逐字节不变 | ✅ 前缀/后缀均等 |
| 935 篇不变 | ✅ |
| id 序逐位不变 | ✅ |
| CRLF 0 / 孤立 CR 0 | ✅ |
| 净字节差 | **+11**（去 2 组半角方括号 −4；`travel` 6B→`旅人，你的脚印` 21B = +15） |
| 改后 sha256 预测 vs 实拉 | ✅ `27876958a6c63be686ae970699c8e5ade9c1aa26f0333d64cfa0899d4e38daca` 逐位一致 |

---

## 三、冒烟（smoke_fix.mjs 真渲染）

**PASS 14 / FAIL 0**，含第 13 项（模板式 ed 与 title/author 一致）、第 14 项（模板式 lead 作者串与 author 一致，3 处修复后仍全绿）。

---

## 四、三要素

| 要素 | 值 |
|---|---|
| 产物绝对路径 | `D:/ZCode/小程序/xijiangyue/index.html` |
| 文件 sha256 | `27876958a6c63be686ae970699c8e5ade9c1aa26f0333d64cfa0899d4e38daca` |
| commit sha | **待 commit（含 index.html，须枯木明确批准）** |

---

## 五、红线核对

935 篇 / id 序不变 ✅｜未批准篇字节级零变 ✅（仅 3 篇 lead 子串）｜CRLF 0 + 孤立 CR 0 ✅｜POEMS 区间外零改动 ✅｜不 push ✅（待枯木批）｜判据均先自证命中 ✅｜改动前 git status 复核 ✅。

**未 commit / 未 push**。报告 + 脚本：
- `out/review-lead-excerpt-113-phase1-20261012.md`（阶段一只读复检）
- `out/review-lead-excerpt-113-phase2-20261012.md`（本报告）
- `D:/AgentHub/temp/xjy-lead-excerpt-20261012/{analyze_113.py, fix_113.py}`
