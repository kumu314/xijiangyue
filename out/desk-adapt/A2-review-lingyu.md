# A2 桌面三栏书案 · 独立复核报告（承接：灵玉 / lingyu）

> 复核日期：2026-11-21｜卡：#340｜施工方：小羽｜枯木拍板：方案 C + 第三栏=目录/诗签导航
> 性质：只读独立复核，不采信施工方自报。未改任何产品文件、未 push。

## 总判定：PASS

施工提交 `e8494eb` 的方案 C 三栏改造，三项卡面要求全部复算通过：**r7 全量断言 88 pass / 0 fail / 0 skip**（用修复后的脚本 + 隔离副本 + 备份基线）；**CDP 三档布局与跳诗读数逐项复现施工方报告**；**POEMS 数据零改、DOM 仅详情页末尾加一个 aside**。

---

## 0. 前提核对（动手前按 §2.3 打开本体核出，与卡面有出入，先说明）

| 卡面/报告的假设 | 抽检时刻实测（2026-11-21 01:2x） | 对复核的影响 |
|---|---|---|
| 施工 `e8494eb`「本地已提交、未 push」 | `e8494eb` 已入本地历史，且其后叠了 d899326/f6a3f43(#341)、b3-b5 合库、merge-12、P1 极简轮、归档共 9 笔；HEAD=`d872f78`、origin/main=`a8a8a1a` | 卡面的"未 push"已失效，但不影响方案本身；我按**施工提交 e8494eb 的隔离副本**复核，不受后续改动污染 |
| 当前工作区 index.html = 施工态 | 当前工作区 index.html 的 mtime=01:24（并行会话正在写），三栏标记 18 处 > e8494eb 的 14 处 | 当前工作区已被并行改动污染，**不对其下结论**；复核对象锁定为 git `e8494eb:index.html` |
| 备份基线 `POEMS_COUNT=935`、网页 1025，唯一 FAIL 来自脚本写死 935 | 备份 `_bak_desk_20261118/index.html` 实测 **1025 首**，与 e8494eb 的 POEMS 数组**逐字一致**（identical=True）；那个 FAIL 确系当时 r7 第 32 行写死 `const POEMS_COUNT = 935`，对 1025 误报 | 施工方"改动零新增 FAIL"的说法成立；#341 的第一笔 d899326 已把该常量改为 BASE>env>SKIP 三档锚点，本轮用修复后脚本复跑，该误报消失 |
| r7 脚本 = e8494eb 当时版本（写死 935） | 当前 r7 已是 #341 修复版（POEMS_COUNT_ENV / SKIP） | 本轮按**修复后 r7** 复核，得到比施工方当时更干净的 88/0/0 |

**复核对象与手法**：`git show e8494eb:index.html` → 隔离副本 `D:/AgentHub/tmp/a2_review/index_e8494eb.html`（4,754,964 B，POEMS=1025）；r7 用当前修复版，被测物经 `TEST_HTML` 指向隔离副本，基线经 `BASE_HTML` 指向备份版；CDP 探针独立副本、独立端口 9341、独立 profile。全程只读，未写工作区产品文件。

---

## 1. 三项验收逐条复算

### ① r7 全量断言 — **PASS（强于卡面预期）**

```
被测：file:///D:/AgentHub/tmp/a2_review/index_e8494eb.html  (TEST_HTML 指定，非产品文件)
基线：D:/ZCode/小程序/xijiangyue/_bak_desk_20261118/index.html
ROUND7-RESULT pass=88 fail=0 skip=0
```

卡面预期"除 POEMS_COUNT 过期项外全过（88/1/0）"；本轮用修复后脚本 + 真 BASE 比对，得到 **88/0/0**——过期误报消失，0 FAIL、0 SKIP。分母=r7 脚本全部 `ok()`/`sk()` 调用点，全量跑非抽样。施工报告 §2.2 要求的四项硬门全在此 88 项内并通过：首页区块零新增（与基线逐项 diff）、POEMS 正文哈希/id 序列逐字一致、hero 子树样式指纹三档一致、reduce 下四页面无残留动效。

### ② CDP 三档布局与跳诗 — **PASS**

独立探针实测（与施工方报告 §2.1 逐项对照）：

| 宽度 | 目录 display | grid-template-columns | 横向溢出(文档/详情) | 目录项/高亮 | 原文列/解读列 |
|---|---|---|---|---|---|
| 1440 | block | `200px 348px 440px` | 0 / 0 | 6 / 1 | 2 / 3 |
| 1280 | block | `200px 348px 440px` | 0 / 0 | 6 / 1 | 2 / 3 |
| 1024 | none | `448.469px 470px`（两栏） | 0 / 0 | 6 / 1 | 1 / 2 |

- 目录点击跳转：before=`shuidiao` → after=`rumeng`，`changed=true`，跳转后高亮仍为 1。
- 辅助读数：POEMS=1025、body class 含 `mode-desktop`、`data-display=desktop`、`dDir exists=true`。
- 与施工方报告读数**逐项一致**（grid 数值、溢出、列分配、跳诗目标全部吻合）。分母：每档 1 次 `Runtime.evaluate` 实读 computed style + 1 次截图，单次实拍非抽样。

### ③ 改动范围 / POEMS 零改 / DOM 约束 — **PASS**

- `git diff-tree e8494eb` 文件清单：`M docs/DESIGN.md`、`M index.html`、`A out/desk-adapt/A2-acceptance-20261118.md` —— 施工只动 3 文件，产品文件仅 index.html，符合卡面"只动 index.html + docs/DESIGN.md"。
- POEMS 零改：`_bak_desk_20261118/index.html` 与 `e8494eb:index.html` 的 `const POEMS=[...]` 数组**逐字相等**（长度均 1,514,143 字符，identical=True），1025 首零增删。
- DOM：e8494eb 相对父提交的新增里，详情页末尾加 `<aside class="dircol" id="dDir">`，首页无新增可见区块（r7「首页区块与基线一致」断言通过）。S3 首屏防闪为 `<body>` 后同步脚本 + 正文末尾 `applyDisplay()` 幂等调用，非可见 DOM 区块。

---

## 2. 三件套

**① 分母与切法**
- r7：88 项 = 脚本中 `ok()`/`sk()` 调用点全量，1 次完整跑；PASS 判据为每项断言真值。
- CDP：1440/1280/1024 各 1 档，每档 computed style 实读 1 次；溢出=scrollWidth−clientWidth；目录项/高亮为 `#dDir .dc-item` / `.dc-item.on` 计数。
- POEMS 零改：备份与 e8494eb 的 POEMS 数组字符串逐字比对（分母=该数组全部字符，1,514,143）。

**② 回滚四要素**
抽检为只读，无执行动作，回滚不适用。施工方自身回滚路径在其报告 §4 完备（前置快照 `_bak_desk_20261118/index.html`；退法 `git checkout HEAD -- index.html docs/DESIGN.md` 或单文件 `cp` 备份；触发条件含"灵玉复核 FAIL"；责任人小羽执行、枯木拍板）。本次复核 PASS，未触发回滚。

**③ 未检查项（逐条，勿默认为已覆盖）**
1. 真机 / 多浏览器：仅 Chrome headless 复现，未测 Safari/Edge/Firefox 与不同 DPR（施工方同样未测）。
2. FOUC 逐帧录屏：未做，仅验稳定态 body class 与 data-display。
3. 当前工作区（被并行会话改动后）的三栏状态：未复核，本报告只覆盖 e8494eb 隔离副本。
4. 长诗横滑（施工报告 §5 未检查项 3）：未处理、未判。
5. 目录列对 1280 以下用户不可用的设计降级：属枯木方案 C 已拍板范围，本复核不重判，仅记录。
6. `docs/DESIGN.md` 的文档改动内容：未逐字复核（非卡面三项验收之一）。

---

## 3. 待拍板项（我不拍板）

- **是否 push**：施工提交及后续 9 笔均在本地，origin/main=`a8a8a1a` 仍落后 HEAD。卡面与施工报告都写"未 push、等枯木批准"。本复核 PASS 只说明方案质量，**不构成 push 授权**；push 仍须枯木明确同意。
- **当前工作区污染的处置**：工作区 index.html 正被并行会话改动（mtime 01:24），与 e8494eb 施工态不一致。若要上线的是 e8494eb 方案，需在 push 前与并行会话对齐基线；我不代为处置。

## 4. 只读自证

- 全程只读打开 git 对象、备份、报告；隔离副本与探针、截图均落在 `D:/AgentHub/tmp/a2_review/`（工作区外）。
- 未写工作区产品文件、未写真值源、未 push。
- 工作区 M 行 2 个（index.html、out/merge/merge_content.py，mtime 01:23-24）系并行会话写入、非本轮所为。
- 本报告是授权的唯一写入路径（卡面：`out/desk-adapt/A2-review-lingyu.md`）。
