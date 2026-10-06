# 西江阅 · 内容合并第二单 交付报告（merge-02）

- 任务：`[[task:xijiangyue-merge-content-02]]`（灵玉 2026-10-05 派单）
- 执行：小羽（workbuddy）· 2026-10-06
- 结论：**四批全部并入成功，红线 1–5 全过，冒烟 4/4 PASS，可提交。**

## 一、并入读数（逐文件）

| 源文件 | 篇数 | 映射字段 | 实际变更篇 | 写入明细 |
|---|---|---|---|---|
| batch-05.json | 40 | `scenes_new→scenes`（整体替换）+ `memory_new→memory` | 40 | scenes 40 条、memory 40 组 |
| batch-06.json | 30 | `串讲`（set_kv 覆盖）+ `memory_new→memory`（整体替换） | 30 | 串讲 30、memory 30 组 |
| trans-04.json | 20 | `lines[].m`（o 快照漂移闸） | 20 | m 173 行 |
| trans-05.json | 40 | `lines[].m`（o 快照漂移闸） | 40 | m 297 行 |
| **合计** | **130 篇次** | — | **128 篇（唯一）** | scenes 40 / 串讲 30 / memory 70 / lines 470 行 |

- 跨批重叠 2 篇（各只计一次）：`t3_38451acf`（batch-06 ∩ trans-04）、`s3_5f470216`（batch-06 ∩ trans-05）——同时并入「串讲+记忆」与「译文 lines」，字段互不冲突。
- `scenes` 写入 40 / 跳过 0；`lines m` 写入 100 篇（含旧源幂等重写），新增变更 60 篇。
- 文件体积：3,570,315 B → 3,652,553 B（**+82,238 B**）。

## 二、跳过清单

- **not-in-POEMS：0**；**scenes-len-mismatch：0**；**o 失配（漂移闸拦截）：0**。四批 id 100% 命中库内 970。
- 唯一「对齐」记录（**非跳过，幂等无净变化**）：`yq_7fa3af82` —— 源 `o` 带曲牌前导「幺」，库内已剥离为「芙蓉映水菊花黄，满目秋光。」；按既有窄化规则（源 o 去前导 1 字 == 库内 o）自动对齐并记入 `_merge_skipped.json.drift_align`。该篇属旧源（trans-01/qoder-01）重跑，值未变。

## 三、红线逐条核对（对照 git HEAD 基线，独立复核）

| # | 红线 | 读数 | 判定 |
|---|---|---|---|
| 1 | 970 首、id 与顺序逐位不变 | n_old=n_new=**970**；`id order identical: True` | ✅ |
| 2 | 未触及篇内容哈希零变化 | 变更 **128** 篇，未触及 **842** 篇逐篇 sha256 相等；`changed ⊆ touched`，且 `changed` 与四批期望集合**双向零差集**（既无越界变更也无该变更未变更） | ✅ |
| 3 | 只动 POEMS，不碰 CSS/JS/HTML；控制台 errs=[] | POEMS 数组**前后文本逐字节相同**（prefix/suffix identical）；非 POEMS `<script>` 块 identical=True；`<style>` 块 identical=True；重渲染 `errs=0` | ✅ |
| 4 | 真渲染冒烟 ≥4 篇，详情页无溢出无报错 | **4/4 PASS**（详见下）；文档级与详情级横向溢出均 false；控制台零报错 | ✅ |
| 5 | 脚本入库、可重跑（幂等） | 脚本落 `out/merge/merge_content.py`（已扩 `scenes_new→scenes` 映射）；重跑 `changed objects: 0`、体积 delta `+0` | ✅ |

## 四、真渲染冒烟（CDP 驱动 headless Chromium，390×844 移动视口）

覆盖任务要求的四类，截图存 `D:/AgentHub/temp/smoke/`：

| 文章 | 类别 | 详情激活 | 溢出(文档/详情) | 新数据渲染 | 报错 |
|---|---|---|---|---|---|
| `w_yemeigui`（野玫瑰·歌德） | scenes_new 外国诗(batch-05) | ✅ | false/false | ✅ | 0 |
| `s3_0e62d42b`（凤凰台上忆吹箫） | 串讲+记忆(batch-06) | ✅ | false/false | ✅ | 0 |
| `t3_e2028920`（江南逢李龟年） | 译文 lines(trans-05) | ✅ | false/false | ✅ | 0 |
| `w_shelimei`（她走在美的光影里·拜伦） | 外国诗(batch-05) | ✅ | false/false | ✅ | 0 |

- 详情页激活判定：`#view-detail.classList.contains('active')` 为 true，标题/作者正确渲染（如「野玫瑰 / 〔德〕歌德」）。
- 「新数据渲染」以各篇新字段特征串在 `#view-detail.textContent` 命中为准（串讲/记忆卡/场景为折叠区，故用 textContent 而非 innerText）。
- **console-errors total = 0**。

## 五、脚本改动（merge_content.py）

1. `SRC` 增四源：batch-05 / batch-06（`v2_batch`）、trans-04 / trans-05（`trans`）。
2. 补丁构建：捕获 `scenes_new` → `patches[id]["scenes"]`。
3. 应用层新增 `scenes` 替换：以库内 `scenes` 数组的**键序与条数为准**，逐条用 `scenes_new` 同键值覆盖、缺键以库内补齐；**条数不符整首跳过并记入报告**（保「保持条数与 s 标签不变」红线）。
4. 统计新增 `scenes_written / scenes_skip` 与日志。

## 六、备注

- 库内 `scenes` 元素键为 `{t, d, quote}`，与 `scenes_new` 完全一致；40 篇目标库内均为单 scene，与 `scenes_new` 条数、t 标签逐一对齐（预检 count/label mismatch 均为 0）。
- batch-05 的 `quote` 较库内 35/40 有更新（精读给出更准的原文引用），随场景整体替换一并落库（灵玉已 PASS）。
