# 西江阅 · 内容量产台账

| 批次 | 范围 | 数量 | 规格 | 产出 | 抽检 | 状态 |
|------|------|------|------|------|------|------|
| pilot-01 | 拓展中文（seed42） | 30 | v1（串讲+记忆技巧扁平字段） | out/content_pilot/pilot-01.json（已从备份恢复入库） | 灵玉 PASS（#46） | **✅ 已合入 5ea98c4**；v1 扁平记忆按单卡映射并入，后续可升 v2.1 结构化卡 |
| batch-02 | 拓展中文（seed43，排除 pilot-01） | 30 | v2.1 | out/content_production/batch-02.json（已入库） | 灵玉 PASS（有条件）→ **三条件已清**：SPEC 口径✅ / t3_89bd9227✅ / 送李端→#55✅（#55 已 done） | **✅ 已合入 5ea98c4** |
| qoder-01 | 拓展中文 m 译文（seed42，排除 pilot-01） | 20（180 句） | 译文线 v1 | out/content_pilot/qoder-01.json（已重建在库） | 灵玉 PASS（#51） | **✅ 已合入 5ea98c4** |
| #61 校勘 | 全库异文/题名/作者疑点 | 起步 5+ | 轻量校勘 | out/review-r5-61-collation.md（3001bc8，320 行 17 节） | — | 已交付（建议清单不动 o，缺陷转 #55/#68 施工） |
| batch-03 | 拓展中文（seed44，排除前两批） | 30 | v2.1 | out/content_production/batch-03.json（已入库） | **灵玉 PASS**（review-batch-03.md：机械项全量+内容抽读全过；2 条既有数据缺陷转 #61/#55，非本批引入） | **✅ 已合入 5ea98c4** |
| batch-04 | 拓展中文（seed45，排除前三批，样本预锁） | 30 | v2.1 | out/content_production/batch-04.json（已入库） | **灵玉 PASS（#1677，f42481c，放行合入）** | 六项自检含跨篇反模板 0 复用；缺陷上报 4 条（永遇乐缺字/残篇/示儿同题异篇/tags 粒度）转 #61/#55，全在 lines.o/title/tags、非本批引入、不阻塞；**✅ 已合入 5ea98c4** |
| trans-01 | 拓展中文 m 译文（seed101，工具面 qoder-trans） | 20 首 133 句 | 译文线 v1 | out/content_production/trans-01.json（6169d0a，已随小羽推送） | **灵玉 PASS（out/review-trans-01.md，放行合入）** | 133/133 自检 + 灵玉独立复算零出入；o 一字不改照抄（头号不变量 0 失配）；A5 已剔出/B11 只动 o 不阻塞 m；唯一条件 B2/B5 若 #55 改字则 m 回改；**✅ 已合入 5ea98c4** |
| trans-02 | 拓展中文 m 译文（seed102，工具面 trae 代 qoder） | 20 首 151 句 | 译文线 v1 | out/content_production/trans-02.json（5c7a4d8，已随小羽推送） | **灵玉 PASS（out/review-trans-02.md，放行合入）** | 六项自检全过；zcode 独立预检全过（漂移 0/151、m/o 比 1.32–2.17、m≥6 字、与前两批零 id 重叠）；新判阻塞曲 2 首已剔除补抽（yq_4cde9faa 宾白科介混入 / yq_b39e7036 片假名タ），转曲类手术；**✅ 已合入 5ea98c4** |
| trans-03 | 拓展中文 m 译文（seed103，工具面 trae） | 20 首 151 句 | 译文线 v1 | out/content_production/trans-03.json + README-trans-03.md（e7f140c，已推 origin/main） | **灵玉 PASS（out/review-trans-03.md，放行合入）** | 机械 151/151 全过；头号不变量「o 一字不改照抄库内」0 失配（独立逐句比对）；跨篇重复 0+自测 PASS；比率 1.125–2.167、最小 m=6；内容逐句全检 151/151 准确（沉江㛤姬→骊姬 o 照抄/m 训诂、混江龙旦末双全、云中君兮节奏、短句 m 处理均验）；曲类 31 首阻塞（4a 8+4b 20+双标点 3）抽样前已剔、非本批引入，转曲类手术；**✅ 已合入（二遍合并 ffc73fe，与 trans-01/02 同批）** |
| batch-05 | 外国诗精读 40 篇升卡（固定 w_ 清单） | 40（记忆卡+场景卡） | 升卡批（memory_new + scenes_new） | out/content_production/batch-05.json + README-05.md（2765006，未 push 待小羽统一） | **灵玉 PASS（out/review-batch-05.md，放行合入）** | 机械 40 首/80 记忆卡/40 场景卡全过（条数/t 白名单/d 55–100/合计 130–260/结构全合规）；**引文失配 0**（80+40 处全为 o/m 连续子串）；**去模板验证**：旧标记（每天读三遍/它是全篇的眼等）命中 0 + 跨篇复用 0 + 检测器自测 PASS；**覆盖面精确命中**旧库带模板标记的 40 篇精读外国诗（其余 13 篇精读外国诗无标记、正确排除）；w_laohu 非法 quote/`lines[0].o` 空格、w_zuiyaoyuan noPP 均核实属实、本批已修 quote；软观察（非阻塞）：memory 收束句式偏集中（便 38/80、就 30/80）；**合并前置：须先扩 merge_content.py 增 scenes_new 整体替换映射** |
| trans-04 | 拓展中文 m 译文（seed 104，工具面 qoder-trans） | 20 首 173 句 | 译文线 v1 | out/content_production/trans-04.json + README-trans-04.md（8ff52cb，未 push 待小羽统一） | **灵玉 PASS（out/review-trans-04.md，放行合入）** | 机械 173/173 全过（诗10/词8/赋2）；头号不变量 o 0 失配；批内/跨批重复 0+自测 PASS；比率 1.059–2.167、最小 m=6；内容逐句核读无误译；**独立证实** qoder-01 `yq_7fa3af82` 漂移 1 处（多「幺」，非本批引入）；4B 2 句夺字转 #61；合入前置无 |
| trans-05 | 拓展中文 m 译文（seed 105，**批次 20→40 放大试点**） | 40 首 297 句 | 译文线 v1 | out/content_production/trans-05.json + README-trans-05.md（8cdfcf2，未 push 待小羽统一） | **灵玉 PASS（out/review-trans-05.md，放行合入）** | 机械 297/297 全过（诗20/词16/赋4，40 首规模门限未松动）；头号不变量 o 0 失配；批内/跨批重复 0+自测 PASS；比率 1.000–2.200、最小 m=6；内容逐句核读无误译（讹字处 m 用通行正字）；4A 5 讹字/4B 九歌标点缺失属实转 #61/#55；合入前置无 |
| batch-06 | 拓展中文（seed 46，排除 pilot/batch-02~04 与 #61 阻塞名单） | 30（串讲+memory_new） | v2.1 | out/content_production/batch-06.json + README-batch-06.md（5ecbe66，未 push 待小羽统一） | **灵玉 PASS（out/review-batch-06.md，放行合入）** | 机械 30 首全过（词12/诗16/曲1/赋1；引文 0 失配）；反模板 0 复用+自测 PASS；**覆盖面精确**（与前批 0 重叠、与 block61 21 条 0 重叠、30 首均真新增——库内已量产恰 120 篇）；上游 6 条缺陷全属实；非阻塞观察：`yq_9bc1d6d9` 已知串烧篇被收（本批内容已避串烧句，合入后仍显污染 lines）；**合并前置：merge_content.py 需支持 串讲/memory_new 映射**（无 scenes_new，映射面小于 batch-05） |
| batch-07 | 拓展中文（seed 47，排除 pilot/batch-02~04/06 与 #61 阻塞名单） | 30（串讲+memory_new） | v2.1 | out/content_production/batch-07.json + README-batch-07.md（47b3e4c，未 push 待小羽统一） | **灵玉 PASS（out/review-batch-07.md，放行合入）** | 机械 30 首全过（诗18/词10/赋2/曲0；引文 0 失配）；反模板跨篇 0 复用 + 注入自测 8 组 PASS；**覆盖面精确**（前批 0 重叠、block61 0 重叠、曲类阻塞 0 重叠、30 首均真新增——库内已量产恰 120 篇）；上游 3 条缺陷（蝶恋花「辘」缺「轳」/回乡偶书 ed_note/李端公 ed_note）全属实、非本批引入；**口径观察**：曲 0 首——生产者额外剔「裸曲牌」致曲池 43→15、随机未中，规格无曲配额、不违规；非阻塞观察：`s3_e6ad04c5` 篇内串讲与名句锚点卡同引一句（非跨篇复用）；**第二复核：qoder 独立复核待出**；**合并前置：merge_content.py 支持 串讲/memory_new 映射**（同 batch-06） |
| trans-06 | 拓展中文 m 译文（seed 106，排除已发译文批与 block61） | 20 首 165 句 | 译文线 v1 | out/content_production/trans-06.json + README-trans-06.md（**a124745**，未 push 待小羽统一） | **灵玉 PASS（out/review-trans-06.md，放行合入）** | 机械 165/165 全过（诗10/词8/赋2，拓展 20/20）；**头号不变量 o 0 失配**（独立逐句比对＝漂移闸独立复算通过）；元数据 title/author/category/level 逐字段 0 失配；比率 min 1.133 / p10 1.211 / med 1.500 / max 2.200、总量 1.530、最小 m=6；反模板整串/n=12/n=8 三把尺本批 0 复用 + 跨已发批（prior 1085 句）0 + **注入自测证活**（整串 1 组 / n=12 8 组）；**覆盖面**：译文线内部 id 零重叠、block61 0 重叠、20 首库内 m 全空（真新增）；生产者自报三处返工（兰陵王[4]/瑞鹤仙[4]/忧苦[13]）逐条核实已落实、o 缺句末标点 0；**⚠️ 跨线重叠 5 首**（xf_01eb95fe←pilot-01、s3_c5cbb32d←batch-06、s3_71904a82←batch-03、谬谏←batch-03、忧苦←batch-04），两线字段不冲突、**不违规**，但 LEDGER 无跨线记录位——待拍板是否加列；软观察 6 条（柳回白眼歧义/凤靴/节行张而不着/锦妇机中字/窈窕余醒寐/阳春增译）均非误译、非阻塞；**第二复核：qoder 待派**；合并前置：无 |

## 附录：pilot-01 的 30 个 id（源：灵玉 #46 抽检报告）

诗：xf_8065f6a3 采薇 / xf_a3cfa98d 小池 / xf_01eb95fe 春日 / t3_df729760 隋宫 / t3_6d4b2d3b 无题四首一 / t3_46d2e29e 春雨 / t3_14405de5 北青萝 / t3_d4508568 杂诗十三 / t3_259f8ab0 新年作 / t3_7c7b6034 宿业师山房期丁大不至 / t3_7137e7db 和张仆射塞下曲四 / t3_b0d3b327 咏怀古迹五首四 / t3_854d475d 子夜吴歌冬歌 / t3_9f8703cd 长干行
词：s3_09bb4727 齐天乐 / s3_76efdfe9 洞仙歌 / s3_cb2dd6c1 浣溪沙 / s3_ccaaa182 醉中真 / s3_a3f3d55e 少年游 / s3_d806fcd1 玉楼春 / s3_78e38024 夜合花 / s3_42c6a42b 忆少年
曲：yq_b322145f 喜春来春宴 / yq_dd4a919d 点绛唇 / yq_8d6626a6 金字经 / yq_19413186 殿前欢
赋：惜誓 / 沉江 / 尊嘉 / 惜贤

## 批次 id 索引

- batch-02 的 30 个 id：见 out/content_production/batch-02.json（已入库，勿再依赖本地副本）
