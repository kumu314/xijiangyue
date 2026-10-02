# #68 内容大合并报告（小羽）

> 任务书：`D:/AgentHub/agent-bridge/e2e/xijiangyue-merge-content-xiaoyu.md`
> 追加裁决：zcode note #1767 / message ec151cec（2026-10-02 16:11）
> 合并脚本：`out/merge/merge_content.py`（可重跑，幂等）
> 仓库：`D:/ZCode/小程序/xijiangyue`
> 基线：`1fcbedf`（首轮）→ `3a7e872`（二遍）

## 0. ★ 本轮重大修正：行尾与格式事故（必须先读）

首轮落盘后自查发现**旧版脚本造成的两处格式破坏**，已定位根因并修复。此处如实记录，因为它直接推翻了先前一版的读数。

### 事故现象

第一次落盘后 `git diff --stat` 报 `index.html | 4120 +++++++-------`，`LF count 71144 → 68432`（**丢 2712 行**）。这不可能是"并入内容"的正常表现。

### 根因（两个独立缺陷叠加）

| # | 缺陷 | 后果 |
|---|---|---|
| 1 | 脚本写死 `assert "\r\n" in text`，**强行把整个 index.html 改写成 CRLF** | 与仓库 `.gitattributes` 的 `*.html text eol=lf` 契约冲突 → 全文件逐行 diff |
| 2 | `lines` / `memory` 重建用**紧凑单行**序列化 | 库内原本是多行展开格式 → 行数骤减、缩进错乱 |

**关键认知**：本仓库的**正解是 LF**（`.gitattributes: *.html text eol=lf`，`git ls-files --eol` 显示 `w/lf`）。先前以为"CRLF 才是原始状态"是**错的**——那是脚本污染后的产物。三个历史备份文件（`index.before-merge.html` / `index.before-trans02.html` / `index.baseline-git.html`）**全部是被污染的副本**（CRLF + 紧凑格式），误当基线会得出错误 diff 读数，已删除；真基线一律以 `git show HEAD:index.html` 为准。

### 修复

1. 脚本改为**跟随输入文件实际行尾**（`EOL` 变量），写回时严格保持一致。
2. `lines` / `memory` 重建改为**库内权威格式**（样本：`jingyesi` 的 `lines`、`大司命` 的 `memory`）：元素前 3 空格、字段前 4 空格、闭合前 2 空格。
3. `set_kv` 增加**风格探测**：替换值前先判断原值是多行还是紧凑，按同风格序列化（`fmt_val`）。
4. 备份改为"仅在基线不存在时落盘一次"，幂等重跑**不覆盖基线**。

### 修复前后对照（同一份内容，三种格式方案）

| 方案 | LF 数 | insertions | deletions | 判定 |
|---|---|---|---|---|
| 旧脚本（CRLF + 紧凑） | 68925 | 4120 | **3416** | ❌ 双重污染 |
| 只修 `lines` | 69944 | 704 | **1904** | ❌ `memory` 仍被压行 |
| **现在（`lines`+`memory` 均修）** | **71152** | 1252 | **1244** | ✅ 真实增删 |

## 1. 并入结果

### 首轮（commit `5ea98c4`）—— 六文件

| 源文件 | 批次 | 篇数 | 映射 | 结果 |
|---|---|---|---|---|
| `out/content_pilot/pilot-01.json` | pilot-01 (v1) | 30 | 串讲 + 记忆技巧→memory `[{t:"记忆技巧",d}]` | ✅ 30/30 |
| `out/content_production/batch-02.json` | batch-02 (v2.1) | 30 | 串讲 + memory_new 整体替换 | ✅ 30/30 |
| `out/content_production/batch-03.json` | batch-03 (v2.1) | 30 | 同上 | ✅ 30/30 |
| `out/content_production/batch-04.json` | batch-04 (v2.1) | 30 | 同上 | ✅ 30/30 |
| `out/content_pilot/qoder-01.json` | qoder-01 | 20 | lines[].m | ✅ 20/20 |
| `out/content_production/trans-01.json` | trans-01 | 20 | lines[].m | ✅ 20/20（1 篇漂移自动对齐） |
| `out/content_production/trans-02.json` | trans-02 | 20 | lines[].m | ✅ 20/20 |

**合计：串讲 120 篇 · 记忆 120 篇 · 逐句译文 60 篇 → 173 首去重**

### 二遍（commit `ffc73fe`）—— trans-03

灵玉 #70 PASS 放行（151/151 逐句全检准确）。脚本加 `--trans03` 开关。

| 源文件 | 批次 | 篇数 | 结果 |
|---|---|---|---|
| `out/content_production/trans-03.json` | trans-03 | 20 | ✅ 20/20 |

**幂等读数**：`changed objects: 20` / `unchanged: 950` —— 前 6 文件 168 首**全部「同值零变化」**，只有第 7 文件那 20 首变化。

### 累计

- 串讲 120 篇 · 记忆 120 篇 · **逐句译文 80 篇**
- **去重后触及 188 首**（173 + trans-03 新增 15 首；trans-03 的 20 首中有 5 首与前批同篇异字段）
- 全库有译文篇数：**296 → 376**（净增 80 ✓）
- `memory shape violations: 0`（970 篇 `memory` 全为规范 `list[dict]`）

## 2. 红线校验（逐字节，非语义哈希）

### 首轮（基线 `1fcbedf`）

| 红线 | 读数 | 判定 |
|---|---|---|
| POEMS 仍为 970 首 | `objs old/new: 970 / 970` | ✅ |
| id 与顺序逐位不变 | `id order identical: True` | ✅ |
| 未触及篇内容零变化 | `byte-identical: 797` / `byte-changed: 173`（797+173=970 自洽） | ✅ |
| 仅 POEMS 变动 | `head bytes identical: True` / `tail bytes identical: True` | ✅ |
| 行尾形态一致 | `EOL preserved: True`（LF） | ✅ |

### 二遍（基线 `3a7e872`）

| 红线 | 读数 | 判定 |
|---|---|---|
| POEMS 仍为 970 首 | `objs old/new: 970 / 970` | ✅ |
| id 与顺序逐位不变 | `id order identical: True` | ✅ |
| 未触及篇内容零变化 | `byte-identical: 950` / `byte-changed: 20`（950+20=970 自洽） | ✅ |
| 仅 POEMS 变动 | `head bytes identical: True (705166 字符)` / `tail bytes identical: True` | ✅ |
| 行尾形态一致 | `EOL preserved: True`（LF，71152 行不变） | ✅ |
| 无 JS 报错 | `errs = []` | ✅ |
| 幂等 | 二跑 `changed objects: 0`、`delta +0`、`cmp` 逐字节相同 | ✅ |

### ★ 关于 `git diff --stat` 的 1252/1244 —— 这是 diff 假象，不是内容丢失

| 口径 | 读数 | 说明 |
|---|---|---|
| POEMS 之外行数 | head `760 → 760`、tail `1574 → 1574` | **完全不变** |
| POEMS 内行数 | `67839 → 67847`（**净 +8**） | 新增 186 行 / 减少 178 行 |
| 变化对象 | **173** | 与预期一致 |
| git 报 insertions/deletions | 1252 / 1244 | 差 **+1066 / +1066** |

**1066 的来源**：git 的 Myers diff 在长文件里对相邻改动做块合并，把一段未变的行重算成「删除+新增」。**字节级证据才是权威**。

### 定点手术说明

脚本**不整块重序列化 JSON**（会重排键序/改缩进/破坏行尾），而是逐篇定位对象文本边界、只对目标篇做定点插入/替换，因此「未触及篇」是**文本逐字节不变**，强于语义哈希相等。

## 3. ★ 渲染层修复 fix(render)

### 现象

本批并入的 **80 篇拓展篇逐句译文，一篇都不会显示**。

### 根因（`index.html:69878`，合并前即存在）

```js
$("#panel-tr").innerHTML = (expand && !hasOrig)
  ? rowO + `<div class="note">本篇为拓展收录，逐句译文正在补充中。</div>` + charmNote + edNote
  : (p.no_paraphrase ? rowO : rowOM) + charmNote + edNote;
```

即：**只要 `level==='拓展'` 且非外国诗（无外文原文），无论 `lines[].m` 有没有内容，控制「解读」页都走「译文正在补充中」分支**，译文 m 被整体丢弃。

### 影响面（渲染层判据实测）

| | 有译文篇数 | 正常渲染 | **被挡** |
|---|---|---|---|
| 首轮合并前 | 296 | 294 | **2** |
| 首轮合并后 | 356 | 294 | **62** |
| 二遍（trans-03）后 | 376 | 294 | **82** |

- **存量被挡 2 篇**：`jiaowo_lbn`、`sishui_lyd` —— 恰是 `no_paraphrase` 豁免的拓展篇。该 bug 早已存在，只是被豁免规则掩盖，从未被触发暴露。
- **本批放大**：译文线（qoder-01 / trans-01/02/03）的**目标池就是拓展篇**——80 篇 100% 命中。不修则译文量产线全部产出永远不可见，**合并价值归零**。

### 修法（采纳 zcode 裁决的最小修法）

```js
const hasTrans = lines.some(l=>l.m && l.m.trim());
$("#panel-tr").innerHTML = (expand && !hasOrig && !hasTrans) ? rowO+`<div class="note">本篇为拓展收录，逐句译文正在补充中。</div>`+charmNote+edNote
  : (p.no_paraphrase ? rowO : rowOM) + charmNote + edNote;
```

判据由「是否拓展篇」改为「**拓展篇且确实无译文**」→ `hasTrans` 与层级解耦，同 #62「判据不绑层级」原则。

**★ 与 zcode 初拟方案的一处差异（请示）**：裁决文本给的是把 `hasTrans && !hasOrig` 提到最前的三目写法。实测发现那会让 `no_paraphrase` 失去作用——`jiaowo_lbn`/`sishui_lyd`（白话诗，m 与 o 近乎重复，故标 no_paraphrase 不显对照）会**重新显示译文**，且另 3 篇**精读** no_paraphrase 篇（`zaibiekangqiao`/`ouran_xzm`/`yuxiang_dws`）也会从 rowO 变 rowOM，违反"精读渲染不变"。故改为**只加一个条件** `&& !hasTrans`：对「拓展有译文」效果完全相同，同时保住 `no_paraphrase` 的最高优先级。**此差异请灵玉复核时一并确认。**

### ★ 红线修订声明

原红线 3 为「只动 POEMS 数据，**不碰 CSS/JS/HTML 结构**」。经 zcode 裁决，本单**修订为**：

> 「**仅此判据一处解耦，其余不碰**」——即：允许对 `#panel-tr` 渲染分支这一处的判据做解耦修改（连同必要的说明注释），其余 CSS / JS / HTML 结构一律不动。

**已验证该修订被严格执行**：与「同一份 POEMS 数据、未 fix」的快照逐段比对——

| 区段 | 读数 |
|---|---|
| head（POEMS 数组之前） | **identical: True**（705166 字符） |
| **POEMS 数组内** | **identical: True**（1101885 字符） |
| tail | 差异 **仅 2 段**：① 节令签注释 ② fix 判据（含注释） |

即 **POEMS 数据 100% 零变化**，改动只落在 tail 的两处预期位置。

## 4. 回归与冒烟（fix(render) 后，28 PASS / 0 FAIL）

脚本：`out/merge/regression_render.js`

| 用例 | 结果 |
|---|---|
| POEMS 总数 = 970 / 首篇 id 不变 | ✅ |
| 被挡数：修正前 82 | ✅（82 = 62 + trans-03 的 20） |
| **被挡数：修正后 0** | ✅ |
| no_paraphrase 有意隐藏（设计内）计数 5 | ✅ |
| ①拓展 + 有译文 → 渲染出 m 列（含 3 篇抽检） | ✅ 4/4 |
| ①译文文本落地、不显占位 | ✅ |
| ②拓展 + 无译文 → 仍显「正在补充中」、不显 m 列 | ✅（`w_beihai`） |
| ③`jiaowo_lbn` / `sishui_lyd`（拓展+noPP）→ 不显 m 列、不显占位 | ✅ 4 项 |
| ④精读 noPP 4 篇（`w_zuiyaoyuan`/`zaibiekangqiao`/`ouran_xzm`/`yuxiang_dws`）→ 不显 m 列 | ✅ 4 项 |
| ⑤精读 `jingyesi` → 显 m 列（不变） | ✅ |
| ⑥外国诗 `sonnet18` → 显 m 列（不变） | ✅ |
| ⑧三档 375 / 390 / 428px 无横向溢出 | ✅ 3 项 |
| 节令签四签在位 | ✅ |
| 控制台 / 页面无 JS 报错 | ✅ |

**RESULT: 28 PASS / 0 FAIL**

## 5. 快照漂移处理（1 篇）

`yq_7fa3af82`《〔正宫〕小梁州·秋》：trans-01 译文基于**旧 o**（首字带曲牌标记「幺」），库内 o 已被 #55 剥离为「芙蓉映水菊花黄，满目秋光。」。

采用**窄化自动对齐**（仅当「源 o 去掉前导单字 == 库内 o」且该字为曲牌标记「幺/么」时放行），未改任何译文内容：

```
drift auto-aligned: 1
  align yq_7fa3af82: 剥离前导「幺」-> '芙蓉映水菊花黄，满目秋光。'
```

`m skipped: 0` —— 无因快照失配而丢弃的译文。

### ★ 顺带上报：#55 修复不彻底（第 4 次「改字段忘同步派生文本」）

`yq_7fa3af82` 被 #55 剥离了题名与 `lines[].o` 的「幺」，但**以下三处派生文本仍带「幺」未同步**：

| 字段 | 现值 | 应为 |
|---|---|---|
| `memory[0].d` | 「先抓住「**幺**芙蓉映」这一句（它是全篇的眼）…」 | 「芙蓉映水」 |
| `scenes[0].d` | 「引一句「**幺**芙蓉映水菊」…」 | 「芙蓉映水菊」 |
| `scenes[0].quote` | 「**幺**芙蓉映水菊」 | 「芙蓉映水菊」 |

与灵玉在 #55 复核中报出的 `t3_11ea1a17`（`story.timeline[].ed` 未同步）**同型**——「改数据字段、忘同步派生文本」已跨 round4 / #55 / #55 扩容 / 本单**四轮重复发生**。建议采纳灵玉提议：**加一道断言**（`story.ed` / `memory.d` / `scenes.d` 中出现的篇名引文必须与当前 `title`/`lines[].o` 一致）。**本单未改数据**（超出机械映射范围）。

## 6. 节令签注释修正（灵玉 #63 软观察）

注释原写「每签 20+ 首真实落地」，与实测不符。实测：

| 季签 | 篇数 |
|---|---|
| 春 | 24 |
| 夏 | **10** |
| 秋 | 33 |
| 冬 | **14** |
| 合计 | 81 |

注释已改为实测值，并注明夏、冬偏少源于该季 tag 直标本就稀疏（夏 4 个 tag / 冬 3 个），属**数据现状而非设计缺陷**，后续内容线可回填。**仅改注释，不动数据**。

## 7. 交付物与入库

| 文件 | 说明 | 状态 |
|---|---|---|
| `index.html` | 合并结果（3402564 → 3570315 字节） | ✅ |
| `out/merge/merge_content.py` | 合并脚本（`--trans02` / `--trans03`，可重跑幂等） | ✅ |
| `out/merge/verify_redline.py` | 红线逐字节校验 | ✅ |
| `out/merge/smoke_merge.js` | 首轮冒烟 | ✅ |
| `out/merge/regression_render.js` | fix(render) 回归（28 用例） | ✅ |
| `out/merge/quant_blocked.py` | 阻断面量化 | ✅ |
| `out/merge-report-01.md` | 本报告 | ✅ |
| `out/merge/index.baseline-before-merge.html` | 基线副本（可再生） | ❌ .gitignore |
| `out/merge/_merge_log.txt` / `_merge_skipped.json` | 中间日志 | ❌ .gitignore |

## 8. 待办

1. **请灵玉独立复核 fix(render) 补丁**（zcode 裁决 d 项要求）——重点确认第 3 节「与初拟方案的差异」（`no_paraphrase` 优先级）是否成立。复核通过后再 push。
2. 移交后续队列：字号收敛 6 档（#62⑧）、曲类数据手术（曲牌混杂/小标题/宾白科介，含 `yq_4cde9faa` / `yq_b39e7036`）、pilot-01 记忆 v1→v2.1 结构化升批。
3. 建议：为 `.gitattributes`（`eol=lf`）与 `core.autocrlf=true` 的**配置冲突**做一次收口——本轮格式事故的土壤就是它。可在仓库加一条 pre-commit 断言：index.html 行尾必须与 `git show HEAD:index.html` 一致。
