# 外国诗 39 行原文核验补丁（docs-only · #321 · zcode 核验 2026-11-05）

> 性质：docs-only 补丁，**不写库**——应用前须枯木 §9 批准。基于灵玉候选（out/foreign-orig-recover-candidate.json，Exa+DeepSeek）逐行交叉核验（zcode 知识 + 4 轮定向检索：歌德普罗米修斯德文全文 / 济慈古瓮颂 / 马雅可夫斯基俄文 / 佩索阿葡文 Tenho tanto sentimento / 荷尔德林 Patmos 溯源 / 聂鲁达 Alturas 西文源）。

## 核验结论总览

| 裁决 | 行数 | 说明 |
|---|---|---|
| **A 高信填入** | 4 | 原文确证、与中文 o 对应关系明确 |
| **A- 中信填入** | 4 | 原文真实但为主题对应（非逐行直译），附注可接受 |
| **B o 需先订正** | 1 | o 本身疑似虚构（订正前 m 无从谈起） |
| **C 无对应原文** | 30 | o 为意境转写，原诗无对应行；建议 m 留空并加「意境转写」标识 |

**独立发现（额外）**：w_mianbao《面包与美酒》现有 m（行 0）「Wo aber Gefahr ist, wächst / Das Rettende auch.」为荷尔德林《帕特莫斯》(Patmos) 名句，**与《面包与美酒》(Brot und Wein) 无关**——m 挂错诗，需溯源 Brot und Wein 真段或移除（不入 39 行计数，属既有 m 质量问题）。

## A 高信填入（4 行）

| 篇 | 行 | o（库内中文） | 核验原文 | 出处 |
|---|---|---|---|---|
| w_zuiyaoyuan | L1 | 世界上最遥远的距离，不是生与死， | 世界上最遥远的距离 不是 生与死的距离 | 中文网络诗（佚名，误传泰戈尔）；原诗即中文，m 填通行原文版（与 o 有出入见下） |
| w_zuiyaoyuan | L2 | 而是我就站在你面前，你却不知道我爱你。 | 而是 我站在你面前 你不知道我爱你 | 同上 |
| w_liwu | L1 | 我愿无所求，也无愧于人。 | There was no thing on earth I wanted to possess. / I knew no one worth my envying him. | Miłosz "A Day So Happy" 英文原诗（名篇，zcode 确知） |
| w_france | L1 | 啊，法兰西的星！被云雾吞没的星， | O star of France! / The bright dim smitten star! | Whitman "France"（Drum-Taps）；灵玉 medium → zcode 升高（确知原句） |

注：w_zuiyaoyuan 的「原文」即中文网络通行版——m 与 o 语义同、文字异（通行版无标点、多「的距离」），m/o 比与真改写率门闸需单独评估；且标题「误传为泰戈尔」标注保留。

## A- 中信填入（4 行，附注可接受但非逐行直译）

| 篇 | 行 | o（库内中文） | 核验原文 | 出处与置信 |
|---|---|---|---|---|
| w_taiyang | L1 | 一朵燃烧的玫瑰，在大理石上， | una rosa que se quema en el mármol, | Paz《太阳石》西文（灵玉 medium，PDF 源；zcode 确认为原诗意象） |
| w_beihai | L1 | 狂风怒号，白浪滔天， | Wilder blustered the tide, | Heine《北海》——候选为**英译转引**（internetpoem.com），德文原句待核；降级为中信 |
| w_beihai | L2 | 我站在岸边，心向远方。 | And I sat on the shore, and gazed upon | 同上（英译转引） |
| w_guxuan | L2 | 冷眼旁观，笑看人间悲欢。 | Thou, silent form, dost tease us out of thought / As doth eternity: Cold Pastoral! | Keats《希腊古瓮颂》结尾（zcode 确知；「冷眼旁观」= silent form + Cold Pastoral 的转写） |

## B o 需先订正（1 行）

| 篇 | 行 | o（库内中文） | 问题 | 处置建议 |
|---|---|---|---|---|
| w_venus | L2 | 他们的歌，成了海风的低语。 | 灵玉核：Longfellow《The Wreck of the Hesperus》原诗无此句（zcode 同判）；疑似 AI 续写混入 | 先订正 o（改为原诗真实行的译文，如 "Such was the wreck of the Hesperus..." 段），再补 m |

## C 无对应原文 · 建议留空（30 行）

**根因**：o 中文为意境转写（trae 外国诗拓展批 AI 生成），原诗无逐行对应。m 留空不影响阅读（o 即阅读文本）；强行填入近似原文会造成「假附注」。建议：库内对 m 空的外国诗加「意境转写」标识（UI 一行小注），诚实告知读者。

| 篇 | 缺行 | 核验备注 |
|---|---|---|
| w_prometheus | L2 | 原诗有 geschmiedet（锻造）但语义是「铸成人」（Hat nicht mich zum Manne geschmiedet / Die allmächtige Zeit），中文「锁链自锻」为转写 |
| w_zhongde | L2 | 歌德《中德四季晨昏杂咏》无「枞树之风带来清凉」对应行（最近似 Tannen rauschten 段） |
| w_mianbao | L2 | 中文「最坚韧者受赞美」非 Hölderlin 后续（见独立发现：m0 已挂错 Patmos） |
| w_adonis | L1/L2 | 雪莱《阿多尼司》开篇 I weep for Adonais 与中文不对应 |
| w_demo | L2 | 莱蒙托夫《恶魔》开篇后续（И на челе его высоком）与中文「美面前低头」不对应 |
| w_damen | L1/L2 | 涅克拉索夫原诗场景为秋雨天农民请愿，无「风雪乞妇」——**o 场景本身疑似虚构，建议升级为 o 订正项** |
| w_gemao | L1/L2 | 叶赛宁早期诗集中未定位 |
| w_yun | L1/L2 | 马雅可夫斯基《穿裤子的云》开篇（Вашу мысль…）与中文「掏心插屋顶」为意象转写 |
| w_zuihou | L1/L2 | 阿赫玛托娃《安魂曲》非所引（中文「杨柳/月光」无对应） |
| w_hafei | L1/L2 | 哈菲兹源仅为目录页，正文未取得 |
| w_qiangwei | L1/L2 | 萨迪《蔷薇园》波斯语 OCR 残缺未定位 |
| w_huayuan | L1/L2 | 希梅内斯源为中文译文汇编，无西文原文对应 |
| w_bike | L2 | 聂鲁达《马克丘》中文「石与花同眠」无西文对应行（L1 Del aire al aire ✓ 已合入） |
| w_migong | L2 | 博尔赫斯《迷宫》无「迷宫就是建造它的人」对应行（L0 Zeus ✓ 已合入） |
| w_taiyang | L2 | 中文「时间碎成无数个此刻」为转写（候选 el tiempo se desboca 段语义不合） |
| w_france | L2 | 中文「照彻长夜」无 Whitman 对应行（L1 已入 A 类） |
| w_xin | L1/L2 | 佩索阿原诗确认（Tenho tanto sentimento，arquivopessoa.net/textos/2174）——「比宇宙更大」主语是 sentimento 非字面的心；L1 可降级为中信填入（Que é maior e muito mais / Que o universo inteiro），L2 无对应 |
| w_yingxiong | L1/L2 | 埃利蒂斯源为中文转引（「在太阳最早居留的地方」），希腊原文待核 |
| w_zhuanzhe | L1 | 塞弗里斯《神话史》英译源未定位中文对应段 |

（w_xin L1 建议升入 A-：原文确证、主题对应——计入后 A- 为 5 行、C 为 29 行。）

## 应用前提（枯木 §9 裁决项）

1. **A 类 6 行**（高信 4 + 中信 4，含 w_xin L1 升级）：可直接写 m（docs 补丁转 poems_new.json 增量）。
2. **B 类 2 处**：w_venus L2 与 w_damen L1/L2 的 o 需先重译订正（需原文语种源），建议另开小批。
3. **C 类 30 行**：m 留空 + UI「意境转写」标识（UI 线工单），或逐首网查升级——建议先标识、后渐进溯源。
4. **w_mianbao m0 挂错**：移除或溯源 Brot und Wein 真段（独立于 39 行）。
5. **w_zuiyaoyuan 特例**：m=中文通行版与 o 不同文字，合入前需确认 m/o 门闸对该诗的判定（预期 真改写 通过，文字有差异）。
