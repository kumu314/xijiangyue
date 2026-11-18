# A2 桌面三栏书案 · 施工验收报告

> 日期：2026-11-18｜执行：小羽｜卡：本地任务 #104–#107｜枯木拍板：**方案 C + 第三栏=目录/诗签导航**
> 状态：**施工完成、本地已提交、未 push**；交灵玉复核后等枯木批准推送。

---

## 0. 一句话结论

按 C 方案落地：首页只打 CSS 稳健补丁（不动 DOM），详情页升级为「目录 / 原文 / 解读」三栏书案（≥1280 生效，1024 回落两栏）。r7 全量断言 **88 pass / 1 fail / 0 skip**，唯一 FAIL 是测试脚本写死 `POEMS_COUNT=935` 的过期口径（备份版同样 FAIL，与本次改动无关）；**我的改动零新增 FAIL**。CDP 实测三档宽度零横向溢出、目录点击跳诗正常。

---

## 1. 改动清单（全部在 `index.html` + `docs/DESIGN.md`）

| 项 | 内容 | 证据标记 |
|---|---|---|
| S1 | 首页三个 `.section-title` 从 `nth-child(4/7/9)` 改为按相邻块 `:has()` / 兄弟选择器定位，与 DOM 序号解耦 | `DESK-PATCH S1` |
| S2 | `.phone` 宽 1180 固定 → `clamp(1100px,84vw,1320px)`；加 ≥1280/1600 分级断点调列间距与标题字号 | `DESK-PATCH S2` |
| S3 | `<body>` 后加同步脚本提前打 `mode-*` class，消首屏 FOUC；正文末尾 `applyDisplay()` 幂等 | `DESK-PATCH S3` |
| 三栏 | 详情页新增 `.dircol#dDir` 目录列（DOM 放末尾），≥1280 三栏（200/自适应/440），1024 回落两栏目录隐藏 | `DESK-PATCH 三栏书案` |
| 渲染 | `renderDirCol(p)`：同体裁相邻 12 首，当前篇朱色高亮，点击 `openDetail(id)` 跳转；只读 POEMS | `function renderDirCol` |
| A1 | DESIGN.md §七「竖排双端风险 P0 未决」→ 已裁决不统一 | 文档改动 |

**DOM 约束**：详情页新增 1 个 `<aside>`（末尾），首页 DOM **一个字未动**；r7 断言只锁 `#view-home` 子块序列，故硬门不破。

---

## 2. 验收读数

### 2.1 CDP 实测（Chrome 157 headless + CDP，`three-col-*.png`）

| 宽度 | 目录 display | grid-template-columns | 横向溢出(文档/详情) | 目录项/高亮 | 列分配 |
|---|---|---|---|---|---|
| 1440 | block | `200px 348px 440px` | 0 / 0 | 6 / 1 | 原文列2 解读列3 |
| 1280 | block | `200px 348px 440px` | 0 / 0 | 6 / 1 | 原文列2 解读列3 |
| 1024 | none | `448px 470px`（两栏） | 0 / 0 | 6 / 1 | 原文列1 解读列2 |

- 目录点击：`shuidiao → rumeng`，跳转成功、高亮跟随（on=1）；
- POEMS 1025（网页实际值，零增删）、body 有 `mode-desktop` + `data-display`（S3 生效）；
- 截图：`out/desk-adapt/three-col-{1440,1280,1024}.png`。

### 2.2 r7 全量断言（带 BASE=备份版）

```
ROUND7-RESULT pass=88 fail=1 skip=0
唯一 FAIL：POEMS 篇数 = 935（零增删） → 1025
```

- ✅ 首页区块与基线完全一致（零新增）
- ✅ POEMS 正文哈希 / id 序列与基线逐字一致
- ✅ hero 子树样式指纹三档一致（意象底 0 增量）
- ✅ reduce 下首页/详情/学习页/设置面板全无残留动效
- ⚠️ 唯一 FAIL 是 `tests/r7-texture-test.mjs:32` 写死 `POEMS_COUNT=935`，网页实际 1025（项目备忘已确认「935 口径作废」）。**备份版跑同一断言同样 FAIL**，非本次引入。为保持复核基线纯净，未改测试脚本。

---

## 3. 分母与切法

| 数字 | 分母 | 切法 |
|---|---|---|
| 88 pass / 1 fail / 0 skip | `tests/r7-texture-test.mjs` 全部 `ok()`/`sk()` 调用点 | 带 `BASE_HTML=<备份版>` 全量跑，非抽样 |
| 三档 grid/溢出/目录读数 | 每档 1 次 CDP `Runtime.evaluate` 实读 computed style | 1440/1280/1024 各 1 次，单次实拍非抽样 |
| 目录 6 项 / 高亮 1 | 词类 309 首，以《水调歌头》为中心前 6 后 5 截窗 | 全量过滤 POEMS 后 slice，只渲染 12 项避免首屏拖慢 |
| POEMS 1025 零增删 | 网页内联 `POEMS` 全表 | 与基线版逐 id 序列 + 正文哈希比对，全量 |

---

## 4. 回滚路径（四要素）

| 要素 | 内容 |
|---|---|
| 前置快照 | `_bak_desk_20261118/index.html`（施工前逐字节副本）；git 父提交 `HEAD`（改动前的 main） |
| 退法 | `git checkout HEAD -- index.html docs/DESIGN.md`（撤回本提交）；或 `cp _bak_desk_20261118/index.html index.html` 单文件回滚 |
| 触发条件 | ① 灵玉复核 FAIL ② 枯木真机/桌面观感不满意 ③ 三档开关失效 ④ r7 出现新增 FAIL（除已知 POEMS_COUNT 过期项） |
| 责任人 | 小羽执行，**枯木拍板**；本次未 push，回滚不涉及远程 |

---

## 5. 未检查项（逐条，勿默认为已覆盖）

1. **未做真机/多浏览器**：只覆盖 Chrome 157 headless，未测 Safari/Edge/Firefox 与不同 DPR。
2. **目录列在 1280 以下完全隐藏**，用户在此宽度无法用目录跳转——这是设计的降级，不是遗漏，但需枯木确认是否接受。
3. **长诗 S4（兰陵王横滑 2.6 屏）未解决**：三栏改造没碰 `.vbody` 折行逻辑（按 r7 铁律不动），横滑仍在；若枯木要治需另立一项。
4. **FOUC 只做了静态推理 + CDP 稳定态验证**，未录屏逐帧确认首屏真的不闪。
5. **POEMS_COUNT 过期项未修**（保持复核基线纯净），下次跑断言会持续显示 1 fail，需项目层面单独决定改不改测试脚本。
6. **目录列对精读/拓展诗的体裁分组**沿用 POEMS 现有 `category` 字段，未做内容质量校验。
7. **未 commit 前的 CSS 语法**只经浏览器实跑验证（三栏生效即语法有效），未跑专门 CSS linter。

---

## 6. 交付状态

- ✅ 本地提交完成（`index.html` + `docs/DESIGN.md` + 本报告）
- ⏳ 交灵玉复核（黑板派单）
- ⛔ **未 push** —— 等枯木明确批准
