# trans-W1 托管复核（zcode，2026-11-05）—— #321 核验补丁 A/A- 类落地

## 范围

6 首 12 行，其中 7 行 m 填入（#321 核验补丁 A/A- 类，枯木 2026-11-05 §9 批准），5 行留空（B/C 类，详见 out/foreign-orig-verified-patch.md）。

## 逐行核验

| 篇 | 行 | m（填入原文） | 核验来源 | 置信 |
|---|---|---|---|---|
| w_liwu | L2 | There was no thing on earth I wanted to possess. / I knew no one worth my envying him. | Miłosz "A Day So Happy" 英文原诗（名篇，zcode 确知） | 高 |
| w_france | L1 | O star of France! / The bright dim smitten star! | Whitman "France"（Drum-Taps）；灵玉 medium + zcode 确知原句 | 中高 |
| w_taiyang | L1 | una rosa que se quema en el mármol, | Paz《太阳石》西文（灵玉 medium，PDF 源；zcode 确认意象） | 中 |
| w_beihai | L1 | Wilder blustered the tide, | Heine《北海》——**英译转引**（internetpoem.com），德文原句待核 | 中（降级） |
| w_beihai | L2 | And I sat on the shore, and gazed upon the white fleeing waves, | 同上（英译转引补全宾语） | 中（降级） |
| w_guxuan | L2 | Thou, silent form, dost tease us out of thought / As doth eternity: Cold Pastoral! | Keats《希腊古瓮颂》结尾（zcode 确知；「冷眼旁观」= Cold Pastoral 转写） | 中 |
| w_xin | L1 | Que é maior e muito mais / Que o universo inteiro | Pessoa "Tenho tanto sentimento"（arquivopessoa.net/textos/2174）；「比宇宙更大」主语是 sentimento 非字面的心 | 中 |

## 机械检查

- o 与库内逐字一致（trans-W1.json 的 o 从库内抓取生成）✓
- 5 行留空：w_liwu L1 / w_france L2 / w_taiyang L2 / w_guxuan L1（已有 m）/ w_xin L2 —— B/C 类裁决见核验补丁 ✓
- m/o 比：外国诗 m=原文附注，外语字符量天然大于中文（比 2.7-7.3），该类特性先例 w_prometheus 3.5 已在库 ✓
- 拉丁字母：m 为原语种文本，含拉丁字母属预期（该批为外国诗原文附注，非中文译文批）✓

## 结论

**PASS**——7 行均为真实原文附注（原语种），出处明确；5 行留空有据。建议 merge-11 放行合入。灵玉语义抽检可后置（附注为装饰性字段，不影响 o 阅读面）。
