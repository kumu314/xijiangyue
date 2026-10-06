# 西江阅 · 内容合并第三单 交付报告（merge-03）

- 触发：灵玉 2026-10-06 放行 batch-08 抽检 PASS，并提示 batch-07 亦未合入、可一起排；另 foreign-expand-01 已产出待合。
- 执行：小羽（workbuddy）· 2026-10-06
- 结论：**三批全部并入成功，红线 1–5 全过，冒烟 4/4 PASS。**

## 一、并入读数

| 源文件 | 篇数 | 映射字段 | 实际变更 |
|---|---|---|---|
| batch-07.json | 30 | `串讲`（set_kv 覆盖）+ `memory_new→memory` | 30 |
| batch-08.json | 30 | `串讲`（set_kv 覆盖）+ `memory_new→memory` | 30 |
| foreign-expand-01.json | 49 | `memory_new→memory` + `scenes_new→scenes` | 49 |
| **合计** | **109 篇** | — | **109（无重叠）** |

- scenes 写入 89 条 / 跳过 0（batch-05 的 40 + foreign-expand-01 的 49，累计口径）；串讲覆盖 60 篇；memory 替换 109 篇。
- 体积：3,652,553 B → 3,741,854 B（**+89,301 B**）。
- 本批无 `lines`（trans 字段缺席），m 写入 100 篇为历史源的幂等重写，非新增。

## 二、跳过清单

- **not-in-POEMS 0 / scenes-len-mismatch 0 / o 失配 0**。三批 id 100% 命中库内 970。
- 沿用 merge-02 记录的唯一窄化对齐（幂等无净变化）：`yq_7fa3af82` 源 `o` 带曲牌前导「幺」。

## 三、红线逐条核对（对照 git HEAD 基线，独立复核）

| # | 红线 | 读数 | 判定 |
|---|---|---|---|
| 1 | 970 首、id 顺序逐位不变 | n=970/970；`id order identical: True` | ✅ |
| 2 | 未触及篇哈希零变化 | 变更 **109**、未触及 **861** 篇 sha256 相等；`changed` 与三批期望集合**双向零差集** | ✅ |
| 3 | 只动 POEMS，不碰 CSS/JS；errs=[] | POEMS 前后文本逐字节同；非 POEMS `<script>` 块 identical；`<style>` identical；控制台 **errs=0** | ✅ |
| 4 | 真渲染冒烟 ≥4 篇，无溢出无报错 | **4/4 PASS**（见下）；文档级+详情级横向溢出均 false | ✅ |
| 5 | 脚本入库、可重跑 | `out/merge/merge_content.py` SRC 增三源；复跑 `changed objects: 0`、delta `+0` | ✅ |

## 四、真渲染冒烟（CDP headless Chromium，390×844）

| 文章 | 类别 | 详情激活 | 溢出(文档/详情) | 新数据渲染 | 报错 |
|---|---|---|---|---|---|
| `jiaowo_lbn` | 串讲+记忆(batch-07) | ✅ | false/false | ✅ | 0 |
| `s3_155ed2cc` | 串讲+记忆(batch-08) | ✅ | false/false | ✅ | 0 |
| `jinsehua_tge` | 外国诗 scenes_new(foreign-expand-01) | ✅ | false/false | ✅ | 0 |
| `t3_e2028920` | 译文 lines(trans-05 对照) | ✅ | false/false | ✅ | 0 |

**console-errors total = 0**；截图存 `D:/AgentHub/temp/smoke/`。

## 五、脚本改动

`merge_content.py` 的 `SRC` 增三源（batch-07 / batch-08 / foreign-expand-01，均 `v2_batch`，复用既有 `串讲`/`memory_new`/`scenes_new` 映射，无需新增逻辑）。foreign-expand-01 的 `scenes_new` 预检：49 篇条数分布全为 (库1,新1)、标签零差异、id 零缺失，故整体替换安全。

## 六、遗留（灵玉已登记，非本单）

- **库内 560 篇 memory 仍是两句固定模板卡**（全为拓展类），本单清掉 109 篇中的 60 篇串讲类，余约 457 篇需 16–18 批清完 → 板上 **#54**。
- filled200 基准已由 120 更新为 150（batch-06 已合入），见 SPEC v2.3.1。
