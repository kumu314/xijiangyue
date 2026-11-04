# 竖排双端预案：逐字 flex 字列（r7b，2026-11-05）

**来历**：黑板 UI 建议 1（双端签名语言一致性）的 web 侧预案件。web 现网竖排卷轴 = `writing-mode: vertical-rl`，在浏览器里稳定；但微信小程序 webview 有 iOS 失效公开案例（SegmentFault 2023-09：安卓正常、iOS 全失效）与旧安卓内核整列旋转 90° 前科。1.0.2 已提审，若小程序端也用了 writing-mode，这是过审后第一批真机反馈的高概率坑。

**本预案证明的事**：不依赖 writing-mode，用「逐字 flex 字列」可以复刻现网卷轴的全部视觉语言——右起列序、朱丝栏界线、遮字、竖排标点形。`index.html` 打开即自检，10 条断言（字数一致性 / A 方案 writing-mode 生效 / B 方案零 writing-mode 依赖 / 右起列序坐标断言 / 列内字序 / vert 标点特性 / masked 数 / 无溢出）。

## 关键技术点

1. **列序**：flex `row` + DOM 倒序装载 → 第一句列在最右，阅读序=右起。
2. **竖排标点形**：逐字排版后 `，。` 会保持横形——用 `font-feature-settings:"vert" 1` 取竖形。Noto Serif SC / 苹方 / 思源宋均带 `vert` 特性；若目标字体缺 vert，退化表现是标点横形（可读，不破版）。
3. **遮字同构**：逐字 span 与现网背诵遮字 `.ch` 同一结构，背诵模式零额外改造。
4. **界线**：列 `border-left` 复刻朱丝栏；最左列去线与现网一致。

## 断言跑法（桌面，无 playwright 依赖）

```bash
chrome --headless=new --dump-dom "file:///…/out/r7b-vertical-fallback/index.html" | grep -o "断言 [0-9]* 条" 
# 全 PASS 判据：dump 内 FAIL 出现 0 次
```

## 交给谁、什么条件下启用

- **先确认**：向小羽要小程序端首页/详情页实现方式（是否 writing-mode）→ iOS 真机验证。
- **启用条件**：仅当小程序端竖排在 iOS 真机失效或不可靠时，按本预案替换；web 端**不动**（桌面浏览器 writing-mode 无风险，且本方案在 A 面板旁立着 B 面板，效果一致）。
- **未验证项**：本页断言仅桌面 Chromium；vert 特性在 iOS WKWebView / 安卓小程序 webview 的表现须真机复核后再定稿。

## 字数与分母

断言分母：诗句 24 字（两联 12 字 ×2，含标点 4），MASK 演示 2 字。面板尺寸 352px 宽舞台 318px 高；列高实测受字号 17px×行高 2 支配，12 字列 ≈ 306px < 318px 不溢出。
