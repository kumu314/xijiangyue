# #68 内容大合并报告（小羽）

> 任务书：`D:/AgentHub/agent-bridge/e2e/xijiangyue-merge-content-xiaoyu.md`
> 执行时间：2026-10-02 15:10–16:00 GMT+8
> 合并脚本：`out/merge/merge_content.py`（可重跑，幂等）
> 仓库：`D:/ZCode/小程序/xijiangyue`　基线：`1fcbedf`（灵玉 #63 五件套复核）

## 0. ★ 本轮重大修正：行尾与格式事故（必须先读）

本轮在提交前自查发现**旧版脚本造成的两处格式破坏**，已定位根因并修复。此处如实记录，因为它直接推翻了先前一版的读数。

### 事故现象

第一次落盘后 `git diff --stat` 报 `index.html | 4120 +++++++-------`，`LF count 71144 → 68432`（**丢 2712 行**）。这不可能是"并入内容"的正常表现。

### 根因（两个独立缺陷叠加）

| # | 缺陷 | 后果 |
|---|---|---|
| 1 | 脚本写死 `assert "\r\n" in text`，**强行把整个 index.html 改写成 CRLF** | 与仓库 `.gitattributes` 的 `*.html text eol=lf` 契约冲突 → 全文件逐行 diff |
| 2 | `lines` / `memory` 重建用**紧凑单行**序列化 | 库内原本是多行展开格式 → 行数骤减、缩进错乱 |

**关键认知**：本仓库的**正解是 LF**（`.gitattributes: *.html text eol=lf`，`git ls-files --eol` 显示 `w/lf`）。先前以为是"CRLF 才是原始状态"的判断是**错的**——那是脚本污染后的产物。三个历史备份文件（`index.before-merge.html` / `index.before-trans02.html` / `index.baseline-git.html`）**全部是被污染的副本**（CRLF + 紧凑格式），误当基线会得出错误 diff 读数，已删除。

### 修复

1. 脚本改为**跟随输入文件实际行尾**（`EOL` 变量），写回时严格保持一致，绝不引入行尾变更。
2. `lines` / `memory` 重建改为**库内权威格式**（见 `jingyesi` 的 `lines`、`大司命` 的 `memory` 为样本）：元素前 3 空格、字段前 4 空格、闭合前 2 空格。
3. `set_kv` 增加**风格探测**：替换值前先判断原值是多行还是紧凑，按同风格序列化（`fmt_val`）。
4. 备份改为"仅在基线不存在时落盘一次"，幂等重跑**不覆盖基线**（否则二跑的"基线"会变成中间产物，红线 2 比对失去意义）。

### 修复前后对照（同一份内容，三种格式方案）

| 方案 | LF 数 | insertions | deletions | 判定 |
|---|---|---|---|---|
| 旧脚本（CRLF + 紧凑） | 68925 | 4120 | **3416** | ❌ 双重污染 |
| 只修 `lines` | 69944 | 704 | **1904** | ❌ `memory` 仍被压行 |
| **现在（`lines`+`memory` 均修）** | **71152** | 1252 | **1244** | ✅ 真实增删 |

## 1. 并入结果

### 本轮并入 6 文件（trans-02 经灵玉 `a7f0b6c` 放行，按任务书「六文件一次并入」执行）

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

### 目标篇数

- 计划触及（distinct）：**173 首**
- 实际写入：**173 首**（`changed objects: 173`）
- 跨批重复 7 首（同一首既做串讲又做译文，字段互不冲突，安全）：
  `t3_5651a527`、`悲回风_先秦_屈原`、`xf_553bf515`、`t3_a067710f`、`yq_7ef4e65c`、
  `t3_e16ce8f7`、`s3_6e5898ed`

### 库内结构完整性

- `memory shape violations: 0` —— 970 篇 `memory` 全为规范 `list[dict]`
- 全库有译文篇数：**296 → 356**（净增 60 ✓，与并入篇数吻合）

## 2. 红线校验（逐字节，非语义哈希）

| 红线 | 读数 | 判定 |
|---|---|---|
| POEMS 仍为 970 首 | `objs old/new: 970 / 970` | ✅ |
| id 与顺序逐位不变 | `id order identical: True` | ✅ |
| 未触及篇内容零变化 | `byte-identical objects: 797`（逐字节比对） | ✅ |
| 797 + 173 = 970 | 自洽 | ✅ |
| 仅 POEMS 变动 | `head bytes identical: True (705166)` / `tail bytes identical: True (83588)` | ✅ |
| 行尾形态一致 | `EOL old: LF / EOL new: LF` → `EOL preserved: True` | ✅ |
| 无 JS 报错 | `errs = []` | ✅ |
| 幂等可重跑 | 二跑 `changed objects: 0`、`delta +0`、`cmp` 输出**逐字节相同** | ✅ |

### ★ 关于 `git diff --stat` 的 1252/1244 —— 这是 diff 假象，不是内容丢失

| 口径 | 读数 | 说明 |
|---|---|---|
| POEMS 之外行数 | head `760 → 760`、tail `1574 → 1574` | **完全不变** |
| POEMS 内行数 | `67839 → 67847`（**净 +8**） | 新增 186 行 / 减少 178 行 |
| 变化对象 | **173** | 与预期一致 |
| git 报 insertions/deletions | 1252 / 1244 | 差 **+1066 / +1066** |

**1066 的来源**：git 的 Myers diff 在长文件里对相邻改动做块合并，把一段未变的行重算成「删除+新增」。**字节级证据才是权威**：head/tail 逐字节相同、POEMS 内仅 173 篇变化、净 +8 行。

### 定点手术说明

脚本**不整块重序列化 JSON**（会重排键序/改缩进/破坏行尾），而是逐篇定位对象文本边界、只对目标篇做定点插入/替换，因此「未触及篇」是**文本逐字节不变**，强于语义哈希相等。

## 3. ★ 阻断项：拓展篇译文被渲染层挡住（本单未修，待裁决）

**现象**：本批并入的 **60 篇拓展篇逐句译文，一篇都不会显示**。

**根因**（`index.html:67649`，合并前即存在）：

```js
$("#panel-tr").innerHTML = (expand && !hasOrig)
  ? rowO + `<div class="note">本篇为拓展收录，逐句译文正在补充中。</div>` + charmNote + edNote
  : (p.no_paraphrase ? rowO : rowOM) + charmNote + edNote;
```

即：**只要 `level==='拓展'` 且非外国诗（无外文原文），无论 `lines[].m` 有没有内容，控制「解读」页都走「译文正在补充中」分支**，译文 m 被整体丢弃。

**影响面量化**：

| | 有译文篇数 | 正常渲染 | **被挡** |
|---|---|---|---|
| 合并前 | 296 | 294 | **2** |
| 合并后 | 356 | 294 | **62** |
| 本批新引入 | +60 | 0 | **+60** |

- **存量被挡 2 篇**：`jiaowo_lbn`、`sishui_lyd` —— 恰是 `no_paraphrase` 豁免的两首，说明该 bug 早已存在、只是被豁免规则掩盖，从未被触发暴露。
- **本批放大**：译文线（qoder-01 / trans-01 / trans-02）的**目标池就是拓展篇**——这批 60 篇 100% 命中该分支。若不修，**译文量产线的全部产出（60 首）永远不可见**。
- **数据层已确认落库**：抽样 `t3_830665e1`（灞上秋居）4 行 `m` 全部写入成功，是**渲染层**挡住了它，非数据问题。

**未擅自修改 JS**：任务书红线 3 明写「只动 POEMS 数据，不碰 CSS/JS/HTML 结构」。我一度做过一行最小修复（判据由「是否拓展篇」改为「是否真有译文 m」），验证有效后**已回滚**，当前 `index.html` 为纯 POEMS 变更。

**建议修法**（供 zcode 裁决）：

```js
const hasTrans = lines.some(l => l.m && l.m.trim());
$("#panel-tr").innerHTML = (hasTrans && !hasOrig) ? rowOM + charmNote + edNote
  : (expand && !hasTrans) ? rowO + `<div class="note">本篇为拓展收录，逐句译文正在补充中。</div>` + charmNote + edNote
  : (p.no_paraphrase ? rowO : rowOM) + charmNote + edNote;
```

一行半改动，判据与层级解耦（精读/拓展同等对待，符合 #62「是否模板与层级无关」的同一原则）。**修后需回归**：`jiaowo_lbn`/`sishui_lyd` 两首带 `no_paraphrase` 的显隐行为不变；外国诗分支不受影响。

## 4. 快照漂移处理（1 篇）

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

这条与灵玉在 #55 复核中报出的 `t3_11ea1a17`（`story.timeline[].ed` 未同步）**同型**——「改数据字段、忘同步派生文本」已跨 round4 / #55 / #55 扩容 / 本单**四轮重复发生**。建议采纳灵玉的提议：**加一道断言**（`story.ed` / `memory.d` / `scenes.d` 中出现的篇名引文必须与当前 `title`/`lines[].o` 一致），否则下轮还会漏。**本单未改数据**（超出机械映射范围，且该篇 memory 恰为量产模板卡，应随内容量产整体替换）。

## 5. 真渲染冒烟

| 用例 | 结果 |
|---|---|
| POEMS 总数 = 970 / 首篇 id 不变 | ✅ |
| 采薇（pilot-01）串讲 + 记忆卡渲染 | ✅ |
| 灞上秋居（qoder-01）译文渲染 | ❌ **被第 3 节渲染层 bug 挡住** |
| 外国诗 sonnet18 正常渲染 | ✅ |
| 竖排详情无横向溢出（ovf=0） | ✅ |
| 节令签回归（4 签在位） | ✅ |
| 控制台/页面无 JS 报错 | ✅ |

**合并版：12 PASS / 1 FAIL**

### ★ 对照组证据：本单零回归

用**干净基线**（`index.baseline-before-merge.html`）跑同一冒烟脚本：

```
RESULT: 12 PASS / 1 FAIL
```

**与合并版完全一致**（PASS 数、FAIL 数、控制台报错均相同）。证明唯一 FAIL 是**渲染层存量 bug**，与本次合并无关，本单**零回归**。

## 6. 交付物与入库

| 文件 | 说明 | 入库 |
|---|---|---|
| `index.html` | 合并结果（3402564 → 3559387 字节） | ✅ |
| `out/merge/merge_content.py` | 合并脚本（可重跑，幂等） | ✅ |
| `out/merge/verify_redline.py` | 红线逐字节校验 | ✅ |
| `out/merge/smoke_merge.js` | 真渲染冒烟 | ✅ |
| `out/merge/quant_blocked.py` | 阻断面量化 | ✅ |
| `out/merge-report-01.md` | 本报告 | ✅ |
| `out/merge/index.baseline-before-merge.html` | 合并前基线副本（可再生） | ❌ .gitignore |
| `out/merge/_merge_log.txt` / `_merge_skipped.json` | 中间日志 | ❌ .gitignore |

## 7. 待办

1. **【阻断】第 3 节渲染层 bug 需 zcode 裁决**：本单内修 or 另开单（修法如上）。
2. 移交后续队列：字号收敛 6 档（#62⑧）、曲类数据手术、pilot-01 记忆 v1→v2.1 升批。
3. 建议：为 `.gitattributes`（`eol=lf`）与 `core.autocrlf=true` 的**配置冲突**做一次收口——本轮格式事故的土壤就是它。建议在仓库加一条 pre-commit 断言：index.html 行尾必须与 `git show HEAD:index.html` 一致。
