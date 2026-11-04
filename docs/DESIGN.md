---
name: 西江阅·诗笺 设计令牌
version: "1.0"
date: 2026-11-05
route: A 宣纸水墨（温润书卷，底色明度 >88%，朱砂只做强调不铺大面积）
role: 单一真值源（web `:root` 与小程序 WXSS 均从本文件导出；改动先改这里）
audited: 2026-11-05，基于 origin/main 合流前本地 main（含 888cea4 round7 全量）
---

# 西江阅·诗笺 DESIGN.md

本文件是设计令牌的**单一真值源**。来历：2026-10-24 全量审美评审后立项双端一致性（黑板建议 1 的 web 侧落地）；令牌值**照抄当前代码**，不改观感——本文档是记录，不是重构。

## 一、色令牌（values 与 index.html `:root` 逐字一致）

```yaml
colors:
  paper:        "#F1E9D7"   # 宣纸底
  paper-card:   "#FBF6EA"   # 卡片纸
  paper-card-2: "#FFFCF4"   # 浮层纸
  ink:          "#2B2620"   # 正文墨
  ink-2:        "#5C5246"   # 次级
  ink-3:        "#6E6248"   # 弱化（11-12px 小字也用它，实测 5.56 AA）
  cinnabar:     "#B23A2E"   # 朱砂（强调/印/选中态）
  cinnabar-deep:"#8E2C22"   # 朱砂深（渐变端/失败态）
  line:         "#E5D9C2"   # 界线
  line-soft:    "#EFE6D4"   # 细界线
  jade:         "#4E6B4A"   # 竹（=五清·竹，兼完成态勾边）
  gold:         "#8A6220"   # 菊/金（streak 数字、菊花印）
  blue:         "#3E5C6E"   # 黛青（点缀，慎用）
  # —— 五清打卡本色（2026-10-27，五枚对纸卡 5.06–7.02 均 AA+；枯为刻意拐点）——
  p-mei:  "#A6394F"         # 梅
  p-lan:  "#6A5A92"         # 兰
  p-song: "#2F5D45"         # 松（7.02 AAA）
  p-wilt: "#8F8577"         # 枯（3.36，仅限非文本 UI 底/描边，禁承载文字）
```

**豁免硬编码**（品牌资产，自有真值源，不升令牌）：`#07C160`（微信登录）、`#12B7F5`（QQ 登录）。

## 二、实测对比度基线（WCAG 2.1 相对亮度，2026-11-05 复算）

分母 = 文字色×底色的全部实际组合（穷举非抽样）。判据：正文/弱化文字 ≥4.5:1；大字与 UI 部件 ≥3:1。

| 组合 | 比值 | 判定 |
|---|---|---|
| ink / paper | 12.40 | AAA |
| ink / paper-card | 13.90 | AAA |
| ink-2 / paper-card | 7.08 | AAA |
| ink-3 / paper-card | 5.56 | AA |
| cinnabar 小字 / paper-card | 5.50 | AA |
| 白字 / cinnabar（按钮·印） | 5.94 | AA |
| p-mei / paper-card | 5.87 | AA |
| p-lan / paper-card | 5.58 | AA |
| jade / paper-card | 5.52 | AA |
| gold / paper-card | 5.06 | AA |
| p-song / paper-card | 7.02 | AAA |
| p-wilt / paper-card | 3.36 | 仅非文本 UI |
| 月历 future 禁用态 / paper | 1.50 | WCAG 禁用豁免 |

唯一豁免项说明：月历未来日 `#C9BFAE` 是刻意的不可点弱化，WCAG 1.4.3 对禁用元素豁免，属设计判断而非疏漏。

## 三、非色令牌

```yaml
radius:  { card: 18px, pill: 999px, sm: 12px }
spacing: { gap: 14px, pad: 20px }        # 注意：小程序导出时 px×2=rpx
fonts:
  serif: "Noto Serif SC","Source Han Serif SC","Songti SC","STSong","SimSun",serif
  kai:   "LXGW WenKai","LXGW WenKai GB","Kaiti SC","STKaiti","KaiTi","DFKai-SB",→serif
  sans:  "Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif
  hei:   "PingFang SC","Microsoft YaHei","Heiti SC","SimHei",sans-serif
reader:  { fs: 18px, ff: kai, lh: 2 }     # 阅读三档设置（xjy_fs/ff/lh）
```

## 四、纸纹资产（#199 P2-4，2026-10-27 落地）

- `--paper-noise-05` / `--paper-noise-08`：两张 SVG feTurbulence 噪声（baseFrequency .9，octaves 2，rect alpha .05/.08），data-URL 内联。
- 档位：`xjy_paper` 键（关/淡/浓），与 `xjy_fs/ff/lh` 同机制存储与云同步。
- 纪律：「浓」不超 0.08——再高显脏；老年低分屏若报摩尔纹先降一档。

## 五、印章系统（#199 P0-1，2026-10-27 落地）

- **6 枚印**：`seal-du / seal-guan / seal-zhi / seal-ji / seal-wen / seal-yue`（读/观/知/记/温/阅），`<symbol>` 内联 + `<use>` 引用。
- **残边**：`filter:url(#sealEdge)`（feTurbulence baseFrequency .11/.13 + feDisplacementMap）模拟印泥渗透；落印动效 stampIn/inkSpread 保留，reduced-motion 降级不变。
- **五清植物**：`plant-mei/lan/zhu/ju` 24×24 symbol（888cea4 补菊花折枝判据）。
- **篆书否决存档**（勿再提）：唯一 SIL OFL 篆体「霞鹜篆书」仅 165 字，读/观/知/记/温/阅全缺；且现网印位仅 22/26/34px，26px 篆书糊成一团。结论=楷形+残边+印泥，证据见黑板 #199 交付 note（2026-10-27）。

## 六、硬编码残量审计（2026-11-05，注释剥离后）

61 处 / 去重 25 色（任务号 `#199`/`#239` 之类不算色值，已排除）。分类与处置建议：

| 类别 | 明细 | 处置 |
|---|---|---|
| 强调底上的白字 | `#FFF` ×20 | **升令牌 `--on-accent`**（最大簇，优先） |
| 朱砂渐变内重写 | `#B23A2E`×8、`#8E2C22`×3 | 换 `var(--cinnabar)`/`var(--cinnabar-deep)` |
| 纸色系渐变内重写 | `#FCF8EE`×4、`#FBF6EA`×4、`#FFF8EC`×2 | 换 var()（渐变内 var() 安全） |
| var() 回退值 | `var(--ink,#2B2620)` 类 | **合规保留**（自引用防御写法） |
| viz 夜空 scoped | `#1E2A3A/#2E3B4E/#4A5266/#F3E6CF` | 二期收成 viz 局部令牌 |
| 外部品牌 | `#07C160`/`#12B7F5` | 豁免（见一节） |
| 一次性装饰 | `#E7DFCB`、`#C9BFAE`、`#F0E2C8` 等 ≤2 处 | 观察即可，不为它们开令牌 |

## 七、双端导出

### WXSS（小程序 `app.wxss`，px→rpx 乘 2）

```css
page{
  --paper:#F1E9D7; --paper-card:#FBF6EA; --paper-card-2:#FFFCF4;
  --ink:#2B2620; --ink-2:#5C5246; --ink-3:#6E6248;
  --cinnabar:#B23A2E; --cinnabar-deep:#8E2C22;
  --line:#E5D9C2; --line-soft:#EFE6D4;
  --jade:#4E6B4A; --gold:#8A6220; --blue:#3E5C6E;
  --p-mei:#A6394F; --p-lan:#6A5A92; --p-song:#2F5D45; --p-wilt:#8F8577;
  --r-card:36rpx; --r-pill:9999rpx; --r-sm:24rpx; --gap:28rpx; --pad:40rpx;
}
```

字体族小程序端按 §三 原样可用（iOS 认 Kaiti SC / Songti SC，安卓回落 serif）。

### 竖排双端风险（P0，未决）

微信小程序 `writing-mode: vertical-rl` 有 iOS 失效公开案例（SegmentFault 2023-09：安卓正常 iOS 全失效）与旧安卓内核 90° 旋转前科。**预案**＝逐字 flex 字列（web 背诵遮字本就是逐字 `.ch` span，架构同源）。演示与断言：`out/r7b-vertical-fallback/`。**小程序端是否受影响待小羽确认实现方式后裁决。**

## 八、维护规矩

1. 改令牌：先改本文件 → 同步 `:root`（web）与 `page{}`（WXSS）→ 跑第二节对比度表复算。令牌定义处只写字面值，`var()` 只出现在使用处（自引用会让整条声明静默失效）。
2. 新色必须先过对比度表再入库；`p-wilt` 类非文本色明示用途边界。
3. 渐变内允许 var()；`var()` 回退值照写（防旧 webview）。
4. 本文件与代码冲突时，**以本文件为准提交修正**；发现漂移先登记黑板再改。
