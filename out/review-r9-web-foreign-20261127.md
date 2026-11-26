# #347 §三-1 补修报告：web reviewable 外国诗排除（2026-11-27）

## 〇、结论先行

枯木 11-27 松口拍板④「web 本期不动」， permissive 到 **只补这一处**：`index.html` 的 `reviewable()` 补 `category==='外国诗'` 排除，与小程序 `isForeign()` 拉回同构。改前红 **10/9**，改后 **19/19 PASS**，反向注入（改回旧版）复红 **10/9**；r7 回归 85/0/3 SKIP、r8 回归 32/0，无回归。

**未 commit、未 push**（按约定含 `index.html` 的入远程须枯木明确批准）。

## 一、问题与口径（分母与切法）

| 口径 | 分母 | 外国诗 | 漏挡（旧版） | 来源 |
|---|---|---|---|---|
| 云端 poems 集合 | 7523 | 117 | **16**（15 缺 `orig_lang` + 1 标 `zh`） | 灵玉 `out/review-memory-stage1-347-lingyu.md` §三-1 全量实测 |
| 网页内联 POEMS | **1025** | 102 | **1**（`w_zuiyaoyuan`，`orig_lang='zh'`） | 本次探针 `tests/_probe-reviewable-foreign.mjs` 全量实测 |

两口径不同，**16 与 1 不可相减**；网页这 1 首正是云端那 1 首同 id 的既存硬伤（全库校验 `w_zuiyaoyuan` 硬伤 1 的同一条）。网页没有「缺 orig_lang 的外国诗」样本（missingLangN=0），但补 category 判断后云端那 15 首一旦进网页也会被挡。

- 旧版本体：`function reviewable(p){ return !!p && !(p.orig_lang && p.orig_lang!=="zh"); }` —— 只看 `orig_lang`。
- 小程序本体（`utils/reviewQueue.js:45-49`）：`isForeign()` = `category==='外国诗'` **或** `orig_lang` 非 zh 任一命中。
- 非外国诗里 `orig_lang` 非 zh 者 = **0**（灵玉云数据口径），说明补 category 排除是纯增益、零误伤。

## 二、改动（唯一一处）

`index.html:78262`，`reviewable()` 由「仅 orig_lang」改为：

```js
function reviewable(p){ return !!p && p.category!=="外国诗" && !(p.orig_lang && p.orig_lang!=="zh"); }
```

上方补 4 行注释写明口径与分母来源。`reviewable` 是 web 温故唯一入口——`touchReview`/`bumpReview`/`reviewDueList`/`nextDueDays` 全走它，补一处即覆盖全链路。零数据字段、零云库、零小程序代码改动。

## 三、验收（分母与切法 / 三件套其一）

### 3.1 断言 `tests/r9-reviewable-test.mjs`（新建，19 条）

- **改前红 10/9**：A1/A2（category 外国诗缺 lang / 标 zh）、B3/B4（网页 1025 全量漏挡 1）、C1/C3/C4/C5（行为层：入队/下次天数/升桶/建档）、D1（源码结构）全红；A3-A7、B1/B2/B5 绿（证明断言不是无差别全红）。
- **改前态夹具注意**（灵玉复验补正）：直接把 `TEST_HTML` 指向 `index.html.bak-20261127-r9-foreign` 会崩 `reviewable is not defined`——扩展名是 `.bak-*`，浏览器当文本打开、不执行 JS。须先复制成 `.html` 后缀临时副本再跑，才得到 10/9。这是夹具限制，非产品缺陷；改前态函数本体另以 grep 实证（旧版无 category 判断）。
- **改后 19/19 PASS**：新增断言覆盖云数据 15 首原型（合成缺 lang 外国诗）与 1 首标 zh 原型；行为层四项实证修复。
- **反向注入**：把改后副本 `reviewable` 改回旧版（`D:/tmp/negctl-r9-foreign.html`），同脚本复红 **10/9**——九条关键断言全部复现，非空转。
- 分母切法：A 组 7 条合成样本 + B 组 1025 首全量（非抽样）+ C 组 4 条行为 + D 组 2 条结构 = 19；全量非抽样。

### 3.2 回归门

| 门 | 结果 | 备注 |
|---|---|---|
| r7-texture-test | **85 PASS / 0 FAIL / 3 SKIP** | **调用口径：`POEMS_COUNT=1025 node tests/r7-texture-test.mjs`**。不带该环境变量跑是 84/0/4（4 个 SKIP 全因缺篇数锚点），两个读数不同口径、不可混用。3 SKIP 因无 BASE_HTML，沿用旧例 |
| r8-minimal-test | **32 PASS / 0 FAIL** | 排版矩阵 375/390/428 × 字号 × 横竖无破版 |

> 口径提醒（灵玉复验补正）：r7 的 85/0/3 必须带 `POEMS_COUNT=1025` 才成立；任何报告引用此数须一并写明参数。

## 四、回滚四要素（三件套其二）

1. **前置快照**：`index.html.bak-20261127-r9-foreign`（4,800,716 B，改前原样），同目录。
2. **退法**：`cp index.html.bak-20261127-r9-foreign index.html` 覆盖即回退；测试脚本 `tests/r9-reviewable-test.mjs` 为新增文件，回退时保留即可（它会红，正是回退的证据）。
3. **触发条件**：灵玉复验不过 / 真机发现温故队列异常 / 枯木改主意恢复「web 本期不动」。
4. **责任人**：枯木拍板，小羽执行。

## 五、未检查项（三件套其三）

- **真机验证**：微信开发者工具里实际点「温」打卡后的队列（属 #352，本次仅浏览器层断言）。
- **云端 16 首**：本次只改网页判定逻辑，云库 7523 首数据未动；云端那 15 首缺 lang 的外国诗是否已被导入、导入后网页是否已能取到，需在云端 Upsert 实操后另验。
- **存量误入队数据**：`xjy_review` localStorage 里若已有外国诗条目，修复后 `reviewDueList` 会过滤掉但不清键——残留数据无害，未做主动清理（避免动用户本地数据）。
- **r9 测试脚本 git 归属**：`tests/r9-reviewable-test.mjs` 目前未入 git（与 `tests/_probe-reviewable-foreign.mjs` 一样是工作区新文件），待枯木批准 push 时一并 add。

## 六、状态与交接

- #347 卡维持 **60%**（阶段二待 1.0.2 过审窗口，本次只做 §三-1 补修，不越权推阶段二）。
- §三-1 决策（上一轮 `board_decision`）由本次施工闭合，结论：松口、已补、待复验。
- 已请灵玉独立复核（不采信自报）：复跑 r9 改后 19/19、反向注入 10/9、r7/r8 回归、对照备份只变 `reviewable` 一处。
- 未 commit / 未 push。
