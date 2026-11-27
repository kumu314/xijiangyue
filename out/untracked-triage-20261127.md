# 未跟踪文件分类与并入必要性判断（2026-11-27）
> 触发：枯木问「103 个未跟踪文件有没有必要合入」。本文只判断、不执行。
> 分母：`git status --porcelain -uall` 的 `??` 项，全量 103 个、12.09 MB（无抽样）。

## 一、结论
**有必要，但只有一类真有必要：49 份 `.md`（353.8 KB）。** 其余 54 项里，10 项是 `.gitignore` 规则漏洞（该挡不该入），44 项符合既有「过程产物不入库」惯例（不必动）。

## 二、三条依据
1. **自家政策明文**：`.gitignore:12` 写「`out/*.md`（复核报告、规格、备忘录）是交付物，**不 ignore，应及时入库**」——49 份 md 是违反自家政策的漏网，不是新立规矩。
2. **同类对照 0 入库**：`anim_*.py` / `anim_*.json` / `content_production/full01~03_part_*.json` / `foreign-orig-*.py` 在已跟踪区一个都没有（`git ls-files out/` 386 项中 anim 仅 4 个 md/cjs）→ 这些未入库是当时就按「产出物不入库」处理的，补入等于改变惯例。
3. **备份不该进 git**：两个 `index.html.bak-*` 合计 9.38 MB，`.gitignore:53-57` 已写明备份目录「不入库但必须活着，否则回滚路径当场失效」，只是规则写的是目录形态 `_bak_*/`，漏了文件形态。

## A、该入（49 项，353.8 KB）

| # | 文件 | 大小 | 日期 | 判定 |
|---|---|---|---|---|
| 1 | `out/foreign-orig-verify-321.md` | 17.9 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 2 | `out/review-anim-gate-precheck-313.md` | 17.1 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 3 | `out/anim-split-decision-20261105.md` | 14.2 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 4 | `out/foreign-orig-recover-report.md` | 13.9 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 5 | `out/anim-final-decision-20261117.md` | 13.2 KB | 2026-11-17 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 6 | `out/decision-321-foreign-m-20261105.md` | 12.1 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 7 | `out/chuanjiang-style-spec-v1.1-lingyu.md` | 11.6 KB | 2026-11-23 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 8 | `out/desk-adapt/desktop-redesign-research-20261118.md` | 11.1 KB | 2026-11-18 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 9 | `out/review-chuanjiang-toolchain-349-lingyu.md` | 11.1 KB | 2026-11-23 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 10 | `out/estimate-full-7523-20261117.md` | 10.7 KB | 2026-11-17 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 11 | `out/upsert90-verify-lingyu.md` | 9.9 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 12 | `out/review-321-crosscheck-lingyu-20261117.md` | 9.1 KB | 2026-11-17 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 13 | `out/review-mem-v2-b3-doubao.md` | 9.0 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 14 | `out/anim-redo-methodology.md` | 8.9 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 15 | `out/anim-attack-phase1-20261105.md` | 8.9 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 16 | `out/r7-assertion-fix-review-lingyu.md` | 8.9 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 17 | `out/ui-pending-decisions-20261118.md` | 8.6 KB | 2026-11-18 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 18 | `out/foreign-poem-originals-fill-template.md` | 8.4 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 19 | `out/backfill-web-unique-20261120.md` | 8.0 KB | 2026-11-20 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 20 | `out/anim-hope-policy-v2-20261105.md` | 7.7 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 21 | `out/chuanjiang-style-spec-20261121.md` | 7.5 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 22 | `out/desk-adapt/A2-review-lingyu.md` | 7.4 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 23 | `out/review-r8-batch8-lingyu.md` | 7.3 KB | 2026-11-26 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 24 | `out/anim-dedup-eval-20261106.md` | 7.2 KB | 2026-11-06 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 25 | `out/anim-holdout-eval-20261105.md` | 7.1 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 26 | `out/dual-end-merge-strategy-20261117.md` | 6.6 KB | 2026-11-17 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 27 | `out/upsert-b6b7-verify-lingyu.md` | 6.5 KB | 2026-11-25 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 28 | `out/full-coverage-audit-20261120.md` | 6.3 KB | 2026-11-20 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 29 | `out/review-anim-backfill-313.md` | 6.0 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 30 | `out/chuanjiang-quality-baseline-7523.md` | 5.9 KB | 2026-11-25 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 31 | `out/chuanjiang-batch9-xiaoya-20261126.md` | 5.3 KB | 2026-11-26 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 32 | `out/chuanjiang-batch7-daya-20261125.md` | 5.1 KB | 2026-11-25 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 33 | `out/chuanjiang-batch8-yasong-20261126.md` | 5.0 KB | 2026-11-26 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 34 | `out/review-batch9-lingyu.md` | 4.8 KB | 2026-11-27 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 35 | `out/cloud-chain-verification-20261121.md` | 4.8 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 36 | `out/foreign-m-draft-3lines-321.md` | 4.7 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 37 | `out/chuanjiang-batch6-shijing-20261122.md` | 4.5 KB | 2026-11-22 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 38 | `out/chuanjiang-pilot30-shijing-20261121.md` | 4.3 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 39 | `out/review-mem-v2-b3-request.md` | 4.2 KB | 2026-11-18 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 40 | `out/chuanjiang-batch2-shijing-20261121.md` | 4.2 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 41 | `out/chuanjiang-batch5-shijing-20261121.md` | 3.8 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 42 | `out/jingdu-last3-chuanjiang-20261120.md` | 3.7 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 43 | `out/chuanjiang-batch4-shijing-20261121.md` | 3.2 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 44 | `out/chuanjiang-batch3-shijing-20261121.md` | 2.9 KB | 2026-11-21 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 45 | `out/_321_advice_draft.md` | 2.7 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 46 | `out/r8-direction-approved.md` | 1.0 KB | 2026-11-19 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 47 | `out/census_after_fill_20261117.md` | 0.9 KB | 2026-11-17 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 48 | `out/census_existing_report.md` | 0.4 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |
| 49 | `out/census_strict_report.md` | 0.2 KB | 2026-11-05 | out/*.md 是交付物，.gitignore:12 明文要求入库 |

## B、该挡（10 项，9.75 MB，补 ignore 规则）

| # | 文件 | 大小 | 日期 | 判定 |
|---|---|---|---|---|
| 1 | `index.html.bak-20261127-r9-foreign` | 4688.2 KB | 2026-11-27 | 施工前备份，.gitignore:53-57 政策「不入库但必须活着」；文件形态规则漏了 |
| 2 | `index.html.bak-20261126-p1v2` | 4688.0 KB | 2026-11-26 | 施工前备份，.gitignore:53-57 政策「不入库但必须活着」；文件形态规则漏了 |
| 3 | `out/anim_pred_full.json.ckpt` | 576.0 KB | 2026-11-05 | 训练/分类中间检查点，可重跑 |
| 4 | `out/_322_recalc.log` | 6.9 KB | 2026-11-05 | 一次性运行日志；有价值日志的入库先例是刻意挑选的 selftest/*.log |
| 5 | `out/tools/__pycache__/chuanjiang_lib.cpython-313.pyc` | 6.6 KB | 2026-11-26 | 编译缓存，可重生成 |
| 6 | `out/foreign-orig-deepseek.log` | 6.2 KB | 2026-11-05 | 一次性运行日志；有价值日志的入库先例是刻意挑选的 selftest/*.log |
| 7 | `out/anim_hope_policy.py.bak-20261105-v1` | 6.1 KB | 2026-11-05 | 施工前备份，.gitignore:53-57 政策「不入库但必须活着」；文件形态规则漏了 |
| 8 | `out/viz-aa-preview-20261126.html` | 5.3 KB | 2026-11-26 | 可重跑的预览页（同 r7-ju/preview.html 先例） |
| 9 | `out/_322_recalc2.log` | 2.8 KB | 2026-11-05 | 一次性运行日志；有价值日志的入库先例是刻意挑选的 selftest/*.log |
| 10 | `out/foreign-orig-recover.log` | 0.0 KB | 2026-11-05 | 一次性运行日志；有价值日志的入库先例是刻意挑选的 selftest/*.log |

## C、维持现状（44 项，约 2.0 MB，不改惯例）

| # | 文件 | 大小 | 日期 | 判定 |
|---|---|---|---|---|
| 1 | `out/anim_attack30.json` | 912.3 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 2 | `out/anim_highconf.json` | 266.1 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 3 | `out/anim_ci_strip_candidates.json` | 230.0 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 4 | `out/anim_write_candidate_strict.json` | 124.5 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 5 | `out/anim_singlesource.json` | 39.5 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 6 | `out/anim_gold_raw.json` | 31.6 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 7 | `out/content_production/full01_part_A.json` | 26.9 KB | 2026-11-17 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 8 | `out/content_production/full03_part_B.json` | 25.9 KB | 2026-11-18 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 9 | `out/content_production/full02_part_B.json` | 25.2 KB | 2026-11-18 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 10 | `out/content_production/full03_part_C.json` | 25.0 KB | 2026-11-18 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 11 | `out/content_production/full03_part_A.json` | 23.9 KB | 2026-11-18 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 12 | `out/content_production/full01_part_C.json` | 23.7 KB | 2026-11-17 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 13 | `out/content_production/full02_part_A.json` | 23.5 KB | 2026-11-18 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 14 | `out/content_production/full02_part_C.json` | 23.3 KB | 2026-11-18 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 15 | `out/foreign-orig-deepseek-candidate.json` | 23.1 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 16 | `out/content_production/full01_part_B.json` | 22.1 KB | 2026-11-17 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 17 | `out/foreign-orig-recover-candidate.json` | 20.9 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 18 | `out/anim_cipai_blacklist.json` | 14.7 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 19 | `out/anim_classify.py` | 11.8 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 20 | `out/anim_dedup_words.json` | 11.6 KB | 2026-11-06 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 21 | `out/anim_hope_policy.py` | 10.5 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 22 | `out/tools/test_review_queue_stage1.mjs` | 10.1 KB | 2026-11-27 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 23 | `out/anim_gold_standard.json` | 9.5 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 24 | `out/anim_pred_gold_v3.json` | 8.8 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 25 | `out/anim_pred_gold_v2.json` | 8.8 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 26 | `out/anim_pred_gold.json` | 8.7 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 27 | `out/foreign-poem-gap-v2.json` | 7.7 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 28 | `out/anim_dedup_eval.py` | 6.8 KB | 2026-11-06 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 29 | `out/foreign-orig-exa-deepseek.py` | 6.7 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 30 | `out/anim_ci_strip_review.py` | 5.9 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 31 | `out/anim_holdout_eval.py` | 5.9 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 32 | `out/foreign-orig-deepseek-search.py` | 5.7 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 33 | `out/foreign-orig-deepseek-recover.py` | 5.3 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 34 | `out/content_production/backfill_web_to_truth_20261120.py` | 5.3 KB | 2026-11-20 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 35 | `out/anim_split.py` | 4.5 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 36 | `out/anim_census.py` | 4.0 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 37 | `out/anim_split_scan.py` | 3.9 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 38 | `out/_313_gate.py` | 3.8 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 39 | `out/foreign-orig-probe.py` | 3.7 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 40 | `out/_bb_handoff.py` | 3.0 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 41 | `out/_ds_test.py` | 2.6 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 42 | `out/_mkreport.py` | 2.0 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 43 | `out/anim_confusion.py` | 1.8 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |
| 44 | `out/anim_gate_eval.py` | 1.7 KB | 2026-11-05 | 过程产物，符合既有「产出物不入库」惯例（anim/content_production 同类文件 0 入库） |

## 建议的 .gitignore 补丁（只挡 B 档，不误伤已有先例）
```
# 施工前备份的文件形态（目录形态 _bak_*/ 已有，见上）
*.bak-*
# Python 编译缓存
__pycache__/
*.pyc
# 分类训练中间检查点
*.ckpt
# 一次性运行日志（精确路径，不碰 out/tools/selftest/*.log 等已入库证据）
out/foreign-orig-*.log
out/_*.log
# 可重跑的预览页（同 out/r7-ju/preview.html 先例）
out/viz-*preview*.html
```

## 顺带发现（需单独决策，不在本次并入范围）
- 已跟踪区存在 `out/tools/__pycache__/chuanjiang_lib.cpython-312.pyc` —— 编译缓存误入库（现用 3.13，312 版已无用）。建议 `git rm --cached` 退库（不删本地），但需枯木点头。
- 已跟踪 9 个 `.log` 全是 `out/tools/selftest/*.log` 与 `dup_scan_post_merge08.log`，是刻意固化的自检证据 → 新规则只写精确路径，不做 `*.log` 一刀切。

## 回滚
- 本轮只新增本文件，无代码/数据改动：`git rm --cached` 或 `git reset` 即可退出，工作树文件不受影响。
