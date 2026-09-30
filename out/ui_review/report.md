# 西江阅 UI 改版验收报告（#38 · xijiangyue-ui-vpoem）

- **验收对象**：`origin/main` `d544614`（blob `04cd56a5`，`index.html` 3,305,791 B）
- **基线**：workbuddy 的 WCAG AA 对比度修复 `91c2fd9d`
- **验收方**：workbuddy（只读仓库，未修改/未推送任何源码）
- **执行方式**：拉取 `d544614` 的 `index.html` 到 `D:\AgentHub\temp\wb-ui-review\`，做静态源码级分析 + 脚本化 WCAG 计算（`wcag_check.py` / `analyze3.py`）。
- **时间**：2026-09-30

---

## 一、结论

**验收通过，可调上线。**

| 级别 | 数量 | 说明 |
|------|------|------|
| P0（不可用 / 对比度不达标） | **0** | 无 |
| P1（明显难看 / 易用性受损） | **1** | hero 落款(signoff) 与朱印(seal) 同钉右下角、无 `z-index` → 视觉打架 |
| P2（打磨 / 待真机复核） | **4** | 见第五节，均需在真机渲染确认，非源码级硬伤 |

- **对比度**：全部 PASS。新 hero 叠加意象背景（opacity .15）后，最坏情况 `--ink-2` 在 `#F6EEDC`+黑@.15 上 = **4.68:1**，仍高于正文 4.5 红线。基线令牌 `#6E6248 / #4E6B4A / #8A6220 / --ink-2` 在 `d544614` 中**全部保留，未回退**。
- **字体**：霞鹜文楷（jsDelivr `lxgw-wenkai-webfont@1.7.0`，`media="print" onload="this.media='all'"` swap 模式）+ CSS 楷体兜底链（`LXGW WenKai → Kaiti SC → STKaiti → KaiTi → DFKai-SB → serif`）已正确接入。
- **唯一 P1** 是 hero 右下角装饰元素重叠，建议修法见第四节（不改源码，仅给 CSS 片段）。

> ⚠️ **渲染环境限制（重要）**：沙箱无可用无头 Chrome，且 `kumu314.github.io` 网络不稳，本报告**未产出截图**、未做真实点击/像素级渲染。视觉回归（竖排卷轴横滚、题签溢出、落款/朱印重叠）与功能回归（tab 切换、飞花令回车、登录两步）均为**静态源码级已查 + 真机渲染待复核**。第四节 P1 是几何定位可确定的硬冲突；P2 是真机侧确认项。

---

## 二、对比度数值表（WCAG 2.1 AA：正文 ≥4.5:1，大字 ≥3:1）

### 2.1 正文/装饰最好情况（无意象背景）

| 检查项 | 颜色 | 背景 | 比值 | 判定 | 备注 |
|--------|------|------|------|------|------|
| hero poem-title | `--ink` | `#FCF8EE` | 14.14 | PASS | |
| hero poem-title | `--ink` | `#F6EEDC` | 12.98 | PASS | |
| hero verse | `--ink-2` | `#FCF8EE` | 7.20 | PASS | |
| hero signoff | `--ink-3` | `#FCF8EE` | 5.65 | PASS | |
| hero tag（自带底 chip） | `--cind` | `#FFFCF4` | 8.08 | PASS | |
| hero seal（红印白字，大字） | `#FFF` | `#B23A2E` | 5.94 | PASS | ≥3 即达标，远超 |
| 竖排题签 vtitle（红底浅字） | `#FBF6EA` | `#B23A2E` | 5.50 | PASS | |
| 竖排原句 vline | `--ink` | `#F1E9D7` | 12.40 | PASS | 朱丝栏可辨不喧宾 |
| 译文/注 .note | `--ink-3` | `#F1E9D7` | 4.96 | PASS | 基线修复值 |

### 2.2 意象背景最坏情况（opacity .15 叠加，半透明 alpha 混合算有效底色）

> 意象底 = `.hero` 渐变 `#FCF8EE→#F6EEDC` + 径向意象图 `opacity:.15`（`filter:saturate(.75)`）。

| 意象色 | 叠加后底 | 文案 | 比值 | 判定 |
|--------|----------|------|------|------|
| heroA `#FCF8EE` + 黑@.15 | `#D6D3CA` | `--ink` | 10.02 | PASS |
| heroA `#FCF8EE` + 黑@.15 | `#D6D3CA` | `--ink-2` | 5.10 | PASS |
| heroA `#FCF8EE` + 深蓝@.15 | `#E0E1DB` | `--ink` | 11.40 | PASS |
| heroA `#FCF8EE` + 深蓝@.15 | `#E0E1DB` | `--ink-2` | 5.80 | PASS |
| heroA `#FCF8EE` + 深绿@.15 | `#E2E3D5` | `--ink` | 11.55 | PASS |
| heroA `#FCF8EE` + 深绿@.15 | `#E2E3D5` | `--ink-2` | 5.88 | PASS |
| heroA `#FCF8EE` + 赭石@.15 | `#EBE2CF` | `--ink` | 11.64 | PASS |
| heroA `#FCF8EE` + 赭石@.15 | `#EBE2CF` | `--ink-2` | 5.93 | PASS |
| heroB `#F6EEDC` + 黑@.15 | `#D1CABB` | `--ink` | 9.19 | PASS |
| **heroB `#F6EEDC` + 黑@.15** | `#D1CABB` | `--ink-2` | **4.68** | **PASS（余量 0.18）** |
| heroB `#F6EEDC` + 深蓝@.15 | `#DAD8CC` | `--ink` | 10.48 | PASS |
| heroB `#F6EEDC` + 深蓝@.15 | `#DAD8CC` | `--ink-2` | 5.34 | PASS |
| heroB `#F6EEDC` + 深绿@.15 | `#DDDAC6` | `--ink` | 10.65 | PASS |
| heroB `#F6EEDC` + 深绿@.15 | `#DDDAC6` | `--ink-2` | 5.42 | PASS |
| heroB `#F6EEDC` + 赭石@.15 | `#E6DAC0` | `--ink` | 10.82 | PASS |
| heroB `#F6EEDC` + 赭石@.15 | `#E6DAC0` | `--ink-2` | 5.51 | PASS |

**结论**：四类意象色（黑/深蓝/深绿/赭石）× 两渐变底，16 组全部 PASS。最紧的一组（heroB+黑，`--ink-2`=4.68）余量仅 0.18，建议后续若调深意象底，复测此组。

---

## 三、视觉回归（静态源码级）

| 项 | 静态核查结果 | 真机复核状态 |
|----|--------------|--------------|
| 竖排卷轴结构 | `.vscroll`/`.vbody`/`.vline`/`.vtitle` 容器均在；`.vscroll{overflow-x:auto}` 横滚可用；`.vbody{height:300px}` 限定高度 | **待复核**：长词（如水调歌头）换列可读性、300px 高度下长诗是否截断 |
| 题签 vtitle | `.vtitle{writing-mode:vertical-rl;background:var(--cinnabar);color:#FBF6EA}`，红底浅字对比度 5.50 PASS | **待复核**：长标题是否溢出容器 |
| 笺纸框 | 双线框 + 贴签结构在 | **待复核**：与贴签/落款/朱印是否重叠（见 P1） |
| 楷体加载 | jsDelivr `<link>` 存在（2 处），`media="print" onload swap`，CSS 楷体兜底链完整 | **待复核**：jsDelivr 失败时应优雅回退本地楷体（逻辑已具备，需实测失败路径） |
| 意象背景 | `.hero-bg{opacity:.15;filter:saturate(.75)}` + 径向定位在 | 见 2.2 对比度，已 PASS |

---

## 四、分级问题清单

### P0（0 个）
无。

### P1（1 个）

**P1-1 · hero 落款(signoff) 与朱印(seal) 重叠打架**

- **位置**：`.hero .signoff` 与 `.hero .seal`（均在英雄区右下角，`position:absolute`，无 `z-index`）。
- **证据（几何定位）**：
  - `.hero .seal`：`right:16px; bottom:16px; width:30px; height:30px` → 占据右 16–46px、底 16–46px。
  - `.hero .signoff`：`right:22px; bottom:20px; writing-mode:vertical-rl; font-size:10px`（竖排 1 列，宽≈10px，高≈字数×(10+2)px） → 占据右 22–32px、底 20–(20+高)px。
  - 二者水平区间重叠（seal 16–46 ⊇ signoff 22–32），竖直区间在底 20–46px 重叠 → **落款首 2–3 字直接压在朱印上**，且因无 `z-index`，层叠顺序依赖 DOM 顺序，渲染不确定。
- **建议修法（CSS 片段，不改源码）**：
  - **方案 A（推荐，右栏上下错开，最接近「钤印在上、落款在下」的传统顺序）**：
    ```css
    .hero .seal{right:16px;bottom:70px;}   /* 原 bottom:16 → 70，上移到落款上方 */
    .hero .signoff{z-index:2;}
    .hero .seal{z-index:1;}
    ```
  - **方案 B（水平错开，朱印左移到落款左侧留白）**：
    ```css
    .hero .seal{right:54px;bottom:16px;}    /* 原 right:16 → 54，水平间隙约 8px */
    ```
    ⚠️ 方案 B 需确认不压到左侧诗文区（hero 正文左对齐，右栏为装饰留白，通常安全，但真机目测一次）。
  - 无论选哪个，都建议补 `z-index` 防御，避免 DOM 顺序导致落款被盖。

### P2（4 个，均待真机复核，非源码硬伤）

- **P2-1 · 竖排长词换列可读性**：`.vbody{height:300px}` + `.vscroll{overflow-x:auto}`。长标题诗（水调歌头）换列后横向滚动是否顺畅、列间是否易读，需真机目测。
- **P2-2 · 题签 vtitle 长标题溢出**：竖排红底题签，长于「水调歌头」的标题可能超出容器高度，真机确认。
- **P2-3 · 楷体失败回退**：jsDelivr 不可达时是否优雅回退本地楷体（CSS 兜底链已写，需断网/拦截实测）。
- **P2-4 · 意象底余量监控**：2.2 中最紧组 4.68（余量 0.18），若日后调深意象背景需复测该组，防跌破 4.5。

---

## 五、功能回归（静态源码级，均"已接线"，点击行为待真机）

| 功能 | 静态证据 | 状态 |
|------|----------|------|
| 详情页五个 tab | 6 个 `.tab` 规则 + 6 处 `data-tab` | 已接线，**点击切换待真机** |
| 换一批 | 文案出现 2 次 | 已接线，**待真机** |
| 飞花令回车提交 | `飞花令` 7 处，`keydown` 1，`e.key==='Enter'` 1 | 已接线，**待真机** |
| 登录两步（验证码） | `验证码` 7 处（网页版登录；非小程序 `getPhoneNumber`） | 已接线，**待真机** |
| 竖排卷轴横滚 | `.vscroll{overflow-x:auto}` | 见 P2-1 |

> 沙箱无渲染环境，上述"点击行为"无法在此验证；源码结构完整、事件处理器在场，无静态断裂迹象。

---

## 六、交付物与限制

- **本报告**：`D:\ZCode\小程序\xijiangyue\out\ui_review\report.md`
- **截图**：**未产出**（沙箱无头 Chrome 不可用 + `kumu314.github.io` 网络不稳）。视觉回归以静态源码分析 + 几何定位替代，已在各节标注"真机复核"项。
- **未修改仓库**：全程只读，未对任何源文件做修改/提交/推送；临时分析文件仅落在 `D:\AgentHub\temp\wb-ui-review\`。
- **黑板**：`xijiangyue-ui-vpoem` 进度置 100；向 zcode 留言「UI 验收完成，P0 0 个 / P1 1 个 / P2 4 个」。

---

## 七、给 zcode 的修法速览（P1）

```css
/* P1-1 推荐方案 A：朱印上移、落款在下，补 z-index 防御 */
.hero .seal{right:16px;bottom:70px;}
.hero .signoff{z-index:2;}
.hero .seal{z-index:1;}
```

落版前务必真机目测一次右下角，确认朱印不与诗文区/落款打架。
