# trans-11 交付说明（30 首 · 185 行逐句白话译文）

- 任务：`[[task:xijiangyue-trans-batch-11]]`（生产面：zcode 自干）
- 规格：SPEC v2.4 译文线——只写 `lines[].m`，`o` 一字不改照抄；m/o ∈[1.0,2.2] 且 m≥6 字
- 交付文件：`out/content_production/trans-11.json`
- **交付状态：仅新增 trans-11.json；本地 commit 不 push。**
- `trans-11.json` sha256 = `dcf2c675879291f44f9473278ca451872a973888e67935f1e4e834fa98e4dad5`（31524 bytes）

## 抽样口径

- `seed=111`（承 trans-10 的 seed=110 递增）。
- 筛选：拓展 + 非曲 + 非外国诗 + m 全空 + 未在 trans-01..10/qoder-01 出现。
- 可用池 311 首 → 抽 30 首（词 11 / 诗 17 / 赋 2），总行数 **185 行**，译文约 3220 字。

## 自检读数

| 项 | 读数 |
|---|---|
| m/o 比 | 全部 185 行 ∈ [1.0, 2.2] ✓（首过即零失败） |
| m ≥ 6 字 | 全部 ✓ |
| o 一字不改 | ✓ |

## 跨线 id 登记

30/30 全部命中串讲线（跨线重叠属预期：两线写不同字段）：

| trans-11 id | 篇名 | 命中串讲线 |
|---|---|---|
| s3_159dea22 | 清平乐·留春不住 | batch-02 |
| s3_30200eb7 | 烛影摇红·双阙中天 | batch-06 |
| s3_5bb87fa8 | 大有·戏马台前 | batch-10 |
| s3_69148d12 | 竹马儿·登孤垒荒 | batch-19 |
| s3_a3f3d55e | 少年游·长安古道 | pilot-01 |
| s3_ad465174 | 南浦·风悲画角 | batch-19 |
| s3_b2d23baf | 高阳台·照野旌旗 | batch-14 |
| s3_bf2d6a06 | 贺新郎·乔木生云 | batch-06 |
| s3_cb2dd6c1 | 浣溪沙·漠漠轻寒 | pilot-01 |
| s3_cd2a9c69 | 疏影·碧圆自洁 | batch-17 |
| s3_d806fcd1 | 玉楼春·绿杨芳草 | pilot-01 |
| t3_0d94fd1d | 书边事 | batch-15 |
| t3_1c26451b | 赋得暮雨送李胄 | batch-17 |
| t3_35297b56 | 月夜忆舍弟 | batch-14 |
| t3_35b7e1eb | 送魏万之京 | batch-03 |
| t3_4e3a052c | 行路难三首 其三 | batch-11 |
| t3_63af8f20 | 溪居 | batch-07 |
| t3_672a309b | 留别王侍御维 | batch-07 |
| t3_72575a2c | 闺怨 | batch-09 |
| t3_7ad6c407 | 晚次鄂州 | batch-15 |
| t3_863f94b8 | 秋夜曲 | batch-07 |
| t3_8aaaf26c | 终南山 | batch-12 |
| t3_93bab9fb | 无题四首 其二 | batch-12 |
| t3_b0efcc24 | 新嫁娘词三首 其三 | batch-12 |
| t3_bf1b2c0a | 韦讽录事宅观曹将军画马图 | batch-08 |
| t3_d4508568 | 杂诗 十三 | pilot-01 |
| t3_d97747ca | 金谷园 | batch-11 |
| t3_e0bf0b55 | 长干曲四首 一 | batch-08 |
| 匡机_汉_王褒 | 匡机（九怀） | batch-13 |
| 山鬼_先秦_屈原 | 山鬼（九歌） | batch-03 |

## 附录：30 个 id

词（11）：s3_159dea22 / s3_30200eb7 / s3_5bb87fa8 / s3_69148d12 / s3_a3f3d55e / s3_ad465174 / s3_b2d23baf / s3_bf2d6a06 / s3_cb2dd6c1 / s3_cd2a9c69 / s3_d806fcd1
诗（17）：t3_0d94fd1d / t3_1c26451b / t3_35297b56 / t3_35b7e1eb / t3_4e3a052c / t3_63af8f20 / t3_672a309b / t3_72575a2c / t3_7ad6c407 / t3_863f94b8 / t3_8aaaf26c / t3_93bab9fb / t3_b0efcc24 / t3_bf1b2c0a / t3_d4508568 / t3_d97747ca / t3_e0bf0b55
赋（2）：匡机_汉_王褒 / 山鬼_先秦_屈原
