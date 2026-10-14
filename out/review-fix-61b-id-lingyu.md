# #61b id 朝代段同步（6ff2a33）独立复核报告（灵玉 · 2026-10-14）

> **性质**：事后独立复核（只读）。对象 commit `6ff2a33`（parent `4c7b0f1`，已推 origin/main，枯木批准执行）。
> **独立性**：开工前未打开生产者交付说明与板面私信原文中的任何复算脚本；全部读数由本报告脚本独立复算，读数先落盘 `D:/AgentHub/temp/xjy-61b-verify/result_61b.json`。
> **口径**：基线 = `git show 4c7b0f1:index.html`，对象 = `git show 6ff2a33:index.html`；**行级 diff 定论**（不用字节区间自算定位）。

## 结论

**PASS**（脚本 37 项全过：index.html 22 项 + anim_map 5 项 + 批 json/全局 10 项，判据全量非抽样）。`6ff2a33` 是一次干净的机械同步：index.html 36 个 id 朝代段 `_先秦_→_汉_`、935 篇 id 与顺序零变、POEMS 段外（head / tail / feihuaData 642793 B / JIELING）逐字节零变、`out/anim_map.json` 36 键值同步且值零变、16 个批 json 28 对 id 同步、`.gitattributes` 仅新增 `out/anim_map.json -text` 规则。**无用户可见影响，无未授权改动。**

**本结论依赖以下假设**（R1）：
- A1：基线 `4c7b0f1` 即 #114 收口后的线上真身——verified：`origin/main` 在该区间前等于 `4c7b0f1`（板面推送记录），且本报告实测 `origin/main` 改后 == `6ff2a33`。
- A2：git blob 内容 == 线上服务内容——verified：`git status` 已跟踪文件 0 modified，工作区 HEAD 即远端。
- A3：本复核只验「数据一致性/同步完整性」，**不重新评判「楚辞汉代作家归汉」这一校勘判断本身**——该校勘 2026-10-12 已由枯木批准定案（ledger `#61b-dynasty-20261009`），本报告不推翻、不复核其文献依据。若 A3 的判断被推翻，本报告的 PASS 只代表「同步执行无瑕疵」，不代表「该改」。
- A4（未验证）：判据未覆盖小程序真机渲染（与所有既往数据卡一致，走 smoke 冒烟兜底）。

## 1. 判据与读数（37 项全 PASS）

### 1.1 index.html（核心）

| # | 判据 | 读数 |
|---|---|---|
| 1 | CRLF | 新旧 blob 均 0 |
| 2 | 总行数 | 69581 = 69581（纯替换，无增删行） |
| 3 | diff 规模 | `-U0` 解析 = 36 对 / 72 行 |
| 4 | `-`/`+` 行形状 | 全部为 `"id"` 键行，无夹带 |
| 5 | 配对性质 | 36 对全部同题名同作者，仅朝代段 `_先秦_`→`_汉_` |
| 6 | id 唯一性 | 36 旧 / 36 新各自互不重复 |
| 7 | feihuaData 块 | 存在（642793 B）且新旧逐字节相同 |
| 8 | JIELING 块 | 逐字节相同 |
| 9 | head（POEMS 前） | 705437 B 逐字节相同 |
| 10 | tail（POEMS 后） | 40493 B 逐字节相同 |
| 11 | 引用面 | 36 个旧 id 在旧文件各出现**恰 1 次**（即只在 POEMS id 行）；feihuaData / JIELING 内命中各 0 |
| 12 | 篇数 | 935 / 935 |
| 13 | 顺序 | 旧序列逐位替换 36 个 == 新序列；其余 899 个 id 逐位零变 |
| 14 | author 用户面 | 36 个新 id 的 author 全为〔汉〕 |
| 15 | 〔先秦〕作者计数 | old = new = **29**（id 改名不触碰 author 文本） |
| 16 | 残余一致性 | 改后仍 `_先秦_` 的 id = **14 个**（屈原/宋玉），其 author 全为〔先秦〕，无朝代交叉错标 |

> 第 11 项是本次复核的**头号判据**：ledger `#61c` 曾确立「先查是否收录，收录才同步」——本批 36 个旧 id 在 feihuaData/JIELING 零命中，故**不同步是正确的**；同步了反而不对。

### 1.2 out/anim_map.json

| # | 判据 | 读数 |
|---|---|---|
| 17 | diff 规模 | 36 对 / 72 行 |
| 18 | 配对性质 | 全部为键名 `_先秦_`→`_汉_` |
| 19 | 收录关系 | 36 个旧 id 各在旧版出现 1 次 |
| 20 | 值零变 | 旧版按 36 对替换后与新版**逐字节相等**（len 73648 → 73612，−36 = 36 键 × 少 1 字） |
| 21 | 键数 | 替换前后键总数不变 |

> 附带合理项：`.gitattributes` 新增 `out/anim_map.json -text`（该文件历史为 CRLF，入库 3895 个 CRLF；不开 `-text` 则行尾归一会产生整文件 diff 淹没真实键改动）。+6 行 = 5 注释 + 1 规则，**与本次数据变更动机自洽**。

### 1.3 16 个批 json（档案同步）

| # | 判据 | 读数 |
|---|---|---|
| 22 | 文件数 | 16 个（pilot-01/qoder-01/batch-02…10/trans-01…07，无 05） |
| 23 | diff 性质 | 全部为 `"id"` 键行 `_先秦_`→`_汉_`，无其他字段 |
| 24 | 对数 | 28（= 小羽私信实测的 28 处遗留 author 处数，分布逐文件一致：pilot-01×4、qoder-01×1、batch-02×2、batch-03×2、batch-04×2、batch-06×1、batch-07×2、batch-08×2、batch-09×2、batch-10×1、trans-01×1、trans-03×1、trans-04×2、trans-05×1、trans-06×2、trans-07×2） |
| 25 | ⊆ 关系 | 28 个 id ⊆ 36 个 POEMS id（差集 0） |
| 26 | 36 的构成 | unique-in-batch **21** + 不在任何批 json **15**；28 对中 7 个 id 跨线重复（沉江/离世/谬谏/忧苦/危俊/悼乱/守志 ×2，均为 trans 线 × 串讲线跨线重叠，与 LEDGER 既有登记一致） |
| 27 | 遗留 author | 批 json 内 `id=_汉_` 而 `author` 仍〔先秦〕共 **28 处**（与小羽实测逐文件一致） |
| 28 | 文件集合 | 变更文件 = 19（index.html + anim_map + 16 批 json + .gitattributes），无越界 |
| 29 | 工作区 | 已跟踪文件 0 modified（HEAD 即线上真身） |
| 30 | 远端 | origin/main = `6ff2a33772a61795bacc9f4c19b8e36837803b4e` == HEAD |

判据 1–16（index.html 22 项 check，表格为合并表述）、17–27（anim_map 5 项）、22–37（批 json 与全局 10 项）：**PASS 37 / FAIL 0**（脚本 `D:/AgentHub/temp/xjy-61b-verify/verify_61b_lingyu.mjs`，可复跑）。

**分母切法**（R11）：37 = 脚本 `check()` 调用计数（index.html 段落 22 + anim_map 段落 5 + 批 json/全局段落 10），逐项编号见 `result_61b.json` 的 `checks` 数组；935 = `const POEMS` 数组内 `"id"` 键全量抽取条数（全量，非抽样）；36 = `git diff -U0` 的 id 行对计数；28 = 16 个批 json diff 的 id 行对计数；20 = 交付类 README 中「行内含 36 个旧 id 之一且 author 仍〔先秦〕」的行数（含旧 id 行 43，差 23 行是 author 已随此前修复更新过的行）。本报告全部为机械全量读数，**无抽样读数**。

## 2. 交叉印证

| 来源 | 说法 | 本复核实测 | 判定 |
|---|---|---|---|
| 小羽私信（10-14 06:07） | 16 批 json 28 处 author 遗留；逐文件分布 | 28 / 分布逐文件一致 | **吻合** |
| dsh 报告 §4-2 | 怨上/悼乱批内 author〔先秦〕而我方〔汉〕 | 属实（在 28 内） | **吻合** |
| 小羽私信 | index.html 用户面 0 处〔先秦〕（指 36 篇） | 36 篇 author 全〔汉〕；全库仍 29〔先秦〕= 屈原/宋玉 14 篇等（非本批范围） | **吻合**（口径需说明：0 是指「36 篇中」） |
| .gitattributes 动机 | anim_map CRLF 历史 | blob 3895 × CRLF | **吻合** |

## 3. 遗留（均不阻塞、不动 index.html）

| # | 遗留 | 影响 | 代价 / 失败模式 |
|---|---|---|---|
| L1 | 批 json 28 处 `id=_汉_` 而 `author` 仍〔先秦〕 | **档案不一致**。实测 `out/merge/merge_content.py` 全文无 `author` 字样 ⇒ 合入不回写 author，**用户面与合入零影响**；影响的是未来「以 json 快照为准」的复核会多判一轮（dsh §4-2 判断正确） | 修 = 28 处机械替换；失败模式 = 漏改（验收机械扫描 0 残留）；不修 = 口径需在 SPEC 写死「批 json author 为交付时点快照」 |
| L2 | 交付类 README 过时行 | 单一口径「含 36 旧 id 且 author 仍〔先秦〕」= **20 行**（小羽实测 18，差 2：README-batch-10 ×1、README-trans-07 ×1，以其口径「表格行」计；README-04 ×2 行 id 旧而 author 已不先秦） | 同 L1；README-04 是 batch-04 交付档案，改否需枯木定 |
| L3 | 15 个 id 不在任何批 json | 这些篇（招隐士/匡机/通路/昭世/陶壅/株昭/思古/逢尤-王逸/疾世/遭厄/哀岁/初放/怨世/自悲/哀命）属**库内基座**、从未进量产批 json ⇒ 本就没有快照可同步 | **无需处理**，登记即可 |
| L4 | 三个 "before" 快照与历史 review md 仍〔先秦〕 | 基线留痕/历史档案 | **不应改**（与小羽边界一致） |

### 3.1 修法选项（L1/L2，呈枯木定）

| 选项 | 动作 | 代价 | 什么时候别用 |
|---|---|---|---|
| **A（推荐）** | 另开 `#61b-sync` 小卡：机械同步 16 个批 json 的 28 处 author + README 20 行（id 与 author 双改），**不动 index.html/anim_map** | 约 1 个小卡的工作量；改动全为纯替换、验收机械扫描 0 残留 | 若枯木裁「批 json 是交付时点档案、不追改」——则走 B |
| B | 不修，LEDGER/SPEC 写死口径「批 json author 为交付时点快照，与库内不一致时不追改」 | 零改动 | 若未来 `merge_content.py` 扩展 author 覆写（当前实测无 author 字样），或新复核以 json 为唯一真值源——则 A 更稳 |

> 两选项共同前提：`merge_content.py` 当前不回写 author（2026-10-14 实测全文无 `author` 字样）。**该前提若变，A 自动升级为必修。**

## 4. 流程观察

1. 本批 commit message（19 文件 105 ins/100 del）与实际 diff 逐文件核对一致，**无夹带**。
2. #61b（10-12 author 35 篇）→ 本批（10-13 id 36 篇 + 批 json id 28 对）分两步走，第二步的 author 跟进漏掉 28 处，根因是「改 id 的脚本与改 author 的脚本分属两次执行、无统一同步闸」。建议后续涉及 id/author 联动的小卡，验收判据加一条「批 json 快照同字段扫描」（一次性机械扫描，成本近零）。
3. 与 #114 相同模式：交付方自检 + 灵玉独立复算双轨，本次同样未采信自检数字（28 处系我独立复算得出，而非引用小羽读数）。

## 5. 复现

```bash
D:/node.js/node.exe D:/AgentHub/temp/xjy-61b-verify/verify_61b_lingyu.mjs
# 读数落盘：D:/AgentHub/temp/xjy-61b-verify/result_61b.json
```

复核者：灵玉（lingyu）｜2026-10-14｜只读边界：未改 index.html 与任何数据文件；本报告 + `result_61b.json` 之外未往仓库写过程产物。
