# trans-W2 语种升级复验报告（zcode，2026-11-21）

**结论：PASS——放行合入。**

## 任务

#321 遗留的「m 位填英译不是原文语种」问题处置（灵玉对照件 §3 单列项）：
w_liwu（米沃什《礼物》，波兰语）、w_beihai（海涅《北海》，德语）四行 m 由英译转引
升级为**原语种原文**；o 一字不改。w_zuiyaoyuan 特例（原诗即中文）m 维持留空，
以 README 特例注记消解卡面「绝不可把中文当原文灌入」的字面冲突（该规则本意防
外国诗 m==o 空转重复；中文诗原文即 o 本身，灌入只会全等重复）。

## 核验证据

### w_liwu（米沃什《Dar》，双源一致 — A 类）

| o 行 | 英译（旧 m，弃） | 波语原文（新 m） |
|---|---|---|
| L0 | A day so happy. / Fog lifted early, I worked in the garden. | Dzień taki szczęśliwy. / Mgła opadła wcześnie, pracowałem w ogrodzie. |
| L1 | There was no thing on earth I wanted to possess. / I knew no one worth my envying him. | Nie było na ziemi rzeczy, którą chciałbym mieć. / Nie znałem nikogo, komu warto byłoby zazdrościć. |

来源（两独立源逐行互证）：
- Wywrota Literatura《Dar》 https://literatura.wywrota.pl/wiersz-klasyka/39922-czeslaw-milosz-dar.html
- PolishTheatre.org《Dar》（Berkeley 1971 版） https://www.polishtheatre.org/post/dar-wiersz-czeslawa-milosza

勘误：灵玉 11-05 报告旧引「Nie chcę nic posiadać」与实际诗行不符，实际为
「Nie było na ziemi rzeczy, którą chciałbym mieć」——按证据纪律以本次双源核验为准。
两源仅首行句读小异（「szczęśliwy,」vs「szczęśliwy.」），取 Berkeley 版句号，影响为 0。

### w_beihai（海涅，Kalliope 逐字 — L0 A- 类 / L1 B 类）

出处：Heine《Erklärung》（Buch der Lieder, Die Nordsee 第二辑开篇）
Kalliope 德语诗歌档案库逐字核验：https://kalliope.org/en/text/heine2002020388

| o 行 | 英译（旧 m，弃） | 德语原文（新 m） | 类 |
|---|---|---|---|
| L0 | Wilder blustered the tide, | Wilder toste die Flut, | A-（逐字） |
| L1 | And I sat on the shore, and gazed upon the white fleeing waves, | Und ich saß am Strand, und schaute zu / Dem weißen Tanz der Wellen | B（对应成立） |

- L0 德行与英译逐字对应（toste↔blustered、Flut↔tide）。
- L1 对应成立但库内英译有改写：原文「Tanz（舞）」被英译作「fleeing（奔逃）」；
  德语原文逐字填入为升级。排除项：《Die Nacht am Strande》
  （de.wikisource.org/wiki/Die_Nacht_am_Strande）经全文核查无对应行。
- **o 分歧保留待裁**：原文「ich saß（坐）」vs 库内 o「我站在岸边」。本次**不动 o**，
  留枯木裁定（订正为坐 / 保留通行译文加注）。此为 #321 遗留最后一项。

## 机械自检

- 批次 o 与库内 o 逐行比对：4/4 一致（merge 门闸内建）。
- 外国诗 m/o 比超 2.2 为原文附注特性（先例 w_prometheus 3.5、trans-W1）。
- 实质率门闸：原语种原文对中文 o 全部为真改写（异语种），100%。

## 放行依据

枯木 2026-11-21 批准执行（对话内「同意」+ 三处分诊方案 ①② 自主核验、③ 保守保留）；
灵玉对照件 §3 待办就此闭环，回联灵玉重跑对照表。

## 附录：o 订正裁定落地（2026-11-21 枯木裁「订正为坐」）

原报告第三节保留的 w_beihai L1「站/坐」分歧，枯木裁定**订正 o**：「我站在岸边」→「我坐在岸边」。
同步六处（merge 幂等性要求，批次 o 必须随库内 o 对齐——湘君 醴→澧 o-mismatch 教训）：
- index.html ×2（o 行 + foreign-expand-01 串讲卡引文）
- foreign-expand-01.json ×1（串讲卡源批）
- trans-W1.json ×1（o）、trans-W2.json ×1（o）
- poems_backfill_candidate_20261120.json ×2（云库回填候选，含卡引文——云库二次导入需带上订正）
merge 复跑 changed 0（幂等），index.html 工作区恰 2 行改动。
