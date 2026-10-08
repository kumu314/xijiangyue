# merge-05 合并报告（trans-06 + trans-07）

- **时间**：2026-10-08 22:45（zcode 值守执行）
- **源**：`out/content_production/trans-06.json`（20 首 165 句，seed=106）+ `trans-07.json`（20 首 156 句，seed=107）+ `merge_content.py` SRC 追加 merge-05 块
- **合入闸**：门闸 17 源全过（trans-06 灵玉 `out/review-trans-06.md` + pi `out/review-trans-06-pi.md` 双 PASS；trans-07 灵玉 `out/review-trans-07.md` PASS 放行合入 20/20）——**抽检在前、合入在后**，顺序符合 SPEC 第 28 行（对比 batch-09/foreign-expand-01 的流程缺口，本批为门闸落地后第一批按序执行）
- **红线五查（独立验证，非信脚本自报）**：
  1. 970 首 id 与顺序逐位不变 ✅
  2. 未触及篇字节级零变化（`verify_redline.py` 备份 vs 新文件逐篇文本比对：text-changed 恰 **40**、byte-identical **930**、head/tail 逐字节相同、EOL LF 保持）✅
  3. 只动 POEMS ✅（head 705,166 B / tail 84,030 B 与备份逐字节相同）
  4. 真渲染冒烟 **13/13 PASS**（系统 Chrome headless、390×844、console 0 报错、新译文可见、无横向溢出；coverage mFull=467 / mAny=9）✅
  5. 幂等复跑 0 变更（changed objects=0、unchanged 970）✅
- **灵玉指定的两项事后核验（已全量复算，等其独立确认）**：
  1. 逐字落库：trans-06 **165 句** + trans-07 **156 句**，按 id 级逐句比对 `o`/`m` 与库内 —— **o 失配 0、m 失配 0** ✅
  2. 误伤探测：未涉及 930 篇中 `m` 非空篇数 **436**（基线 436，保持）；**filled200 = 270**（基线 270，保持）；全库 m 非空 476 = 436+40 符合预期 ✅
- **备份**：`D:/AgentHub/temp/xjy-merge05/index.html.bak-20261008-2200`（3,814,044 bytes）
- **状态**：已合入 index.html、本地入库；入远程由小羽统一执行
- **备注**：
  - DUPLICATE across batches 警告含 trans-06 6 首 / trans-07 10 首跨线重叠（串讲线×译文线字段不相交，设计内，LEDGER 已登记，不违规）；
  - drift auto-aligned 1 条（yq_7fa3af82 前导「幺」对齐库内权威文本，历史遗留、非本批篇目）；
  - 合入后全库读数：m 非空 476 篇 / filled200（串讲≥200 字）270 篇，供后续批次池测算基线。
