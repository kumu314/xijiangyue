# merge-04 合并报告（batch-09）

- **时间**：2026-10-07 19:05（zcode 值守执行）
- **源**：`out/content_production/batch-09.json`（30 篇：词12/诗14/赋4，seed=49）+ `merge_content.py` SRC 追加一行
- **合入闸**：zcode 托管复核 PASS（机械/引文/反模板/抽读四部分全过；报告 `D:/AgentHub/temp/zcode-b09-tuoguan-review.txt`，advice_lint 7/7 PASS；灵玉固定口径复核仍可后续独立补做，冲突以其为准）
- **红线五查（独立验证，非信脚本自报）**：
  1. 970 首 id 与顺序逐位不变 ✅
  2. 未触及篇哈希零变化（actually changed=30 / unchanged=940；变化集精确等于 batch-09 的 30 篇）✅
  3. 只动 POEMS：数组前/后文本与备份逐字节相同 ✅
  4. 真渲染冒烟 4/4 PASS（系统 Chrome headless、390×844、console-errors=0、新数据可见、无溢出）✅
  5. 幂等复跑 0 变更（changed objects=0）✅
- **备份**：`D:/AgentHub/temp/xjy-merge04/index.html.bak-20261007-1900`（3,781,458 bytes）
- **状态**：已合入 index.html、已本地 commit、**未 push（等枯木批准）**
- **备注**：
  - DUPLICATE across batches 警告 6 条全为译文线×串讲线 field 级并存（设计内，历史批次同类警告为常态）；
  - drift auto-aligned 1 条（yq_7fa3af82：源快照前导「幺」对齐库内），非本批篇目、不动库内容；
  - 冒烟脚本本次改用系统 Chrome（原 ms-playwright headless-shell 已被清理），`D:/AgentHub/temp/smoke_b09.mjs`。
