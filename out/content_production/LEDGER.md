# 西江阅 · 内容量产台账

| 批次 | 范围 | 数量 | 规格 | 产出 | 抽检 | 状态 |
|------|------|------|------|------|------|------|
| pilot-01 | 拓展中文（seed42） | 30 | v1（串讲+记忆技巧扁平字段） | out/content_pilot/pilot-01.json（已从备份恢复入库） | 灵玉 PASS（#46） | 待合入（merge #68）；v1 扁平记忆按单卡映射并入，后续可升 v2.1 结构化卡 |
| batch-02 | 拓展中文（seed43，排除 pilot-01） | 30 | v2.1 | out/content_production/batch-02.json（已入库） | 灵玉 PASS（有条件）→ **三条件已清**：SPEC 口径✅ / t3_89bd9227✅ / 送李端→#55✅（#55 已 done） | 待合入（merge #68） |
| qoder-01 | 拓展中文 m 译文（seed42，排除 pilot-01） | 20（180 句） | 译文线 v1 | out/content_pilot/qoder-01.json（已重建在库） | 灵玉 PASS（#51） | 待合入（merge #68） |
| #61 校勘 | 全库异文/题名/作者疑点 | 起步 5+ | 轻量校勘 | out/review-r5-61-collation.md（3001bc8，320 行 17 节） | — | 已交付（建议清单不动 o，缺陷转 #55/#68 施工） |
| batch-03 | 拓展中文（seed44，排除前两批） | 30 | v2.1 | out/content_production/batch-03.json（已入库） | **灵玉 PASS**（review-batch-03.md：机械项全量+内容抽读全过；2 条既有数据缺陷转 #61/#55，非本批引入） | 待合入（merge #68） |
| batch-04 | 拓展中文（seed45，排除前三批，样本预锁） | 30 | v2.1 | out/content_production/batch-04.json（已入库） | **灵玉 PASS（#1677，f42481c，放行合入）** | 六项自检含跨篇反模板 0 复用；缺陷上报 4 条（永遇乐缺字/残篇/示儿同题异篇/tags 粒度）转 #61/#55，全在 lines.o/title/tags、非本批引入、不阻塞；**待合入（merge #68）** |
| trans-01 | 拓展中文 m 译文（seed101，工具面 qoder-trans） | 20 首 133 句 | 译文线 v1 | out/content_production/trans-01.json（6169d0a，已随小羽推送） | **灵玉 PASS（out/review-trans-01.md，放行合入）** | 133/133 自检 + 灵玉独立复算零出入；o 一字不改照抄（头号不变量 0 失配）；A5 已剔出/B11 只动 o 不阻塞 m；唯一条件 B2/B5 若 #55 改字则 m 回改 |
| trans-02 | 拓展中文 m 译文（seed102，工具面 trae 代 qoder） | 20 首 151 句 | 译文线 v1 | out/content_production/trans-02.json（5c7a4d8，已随小羽推送） | **灵玉 PASS（out/review-trans-02.md，放行合入）** | 六项自检全过；zcode 独立预检全过（漂移 0/151、m/o 比 1.32–2.17、m≥6 字、与前两批零 id 重叠）；新判阻塞曲 2 首已剔除补抽（yq_4cde9faa 宾白科介混入 / yq_b39e7036 片假名タ），转曲类手术 |

## 附录：pilot-01 的 30 个 id（源：灵玉 #46 抽检报告）

诗：xf_8065f6a3 采薇 / xf_a3cfa98d 小池 / xf_01eb95fe 春日 / t3_df729760 隋宫 / t3_6d4b2d3b 无题四首一 / t3_46d2e29e 春雨 / t3_14405de5 北青萝 / t3_d4508568 杂诗十三 / t3_259f8ab0 新年作 / t3_7c7b6034 宿业师山房期丁大不至 / t3_7137e7db 和张仆射塞下曲四 / t3_b0d3b327 咏怀古迹五首四 / t3_854d475d 子夜吴歌冬歌 / t3_9f8703cd 长干行
词：s3_09bb4727 齐天乐 / s3_76efdfe9 洞仙歌 / s3_cb2dd6c1 浣溪沙 / s3_ccaaa182 醉中真 / s3_a3f3d55e 少年游 / s3_d806fcd1 玉楼春 / s3_78e38024 夜合花 / s3_42c6a42b 忆少年
曲：yq_b322145f 喜春来春宴 / yq_dd4a919d 点绛唇 / yq_8d6626a6 金字经 / yq_19413186 殿前欢
赋：惜誓 / 沉江 / 尊嘉 / 惜贤

## 批次 id 索引

- batch-02 的 30 个 id：见 out/content_production/batch-02.json（已入库，勿再依赖本地副本）
