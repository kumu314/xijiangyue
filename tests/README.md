# 西江阅前端回归测试

本目录收录对 `index.html` 的自动化回归与内容层审计，全部基于 **真实页面上下文**：
用 `playwright-core` 拉起本机 Chrome 无头模式加载 `index.html`，再在页面里调用产品自带函数
（`ttsFix` / `poemRhymesMa` / `TTS.*` / 朗读与温故的渲染函数）做断言。
不走 DOM 点击模拟，断言稳定、可读、可直接对拍复核。

## 运行环境

- 需要本机已装 **Google Chrome**（脚本用 `channel: 'chrome'` 调系统 Chrome，无需下载驱动）。
- 依赖只需 `playwright-core`：

```bash
cd tests
npm install          # 仅安装 playwright-core（devDependency）
```

- 脚本写死了本机路径 `file:///D:/ZCode/小程序/xijiangyue/index.html`。
  换机/换目录时改各文件顶部的 `HTML` 常量即可。

## 用例清单

| 文件 | 覆盖 | 断言数 | 关联卡 |
|------|------|--------|--------|
| `tts-test-v2.mjs` | 朗读分段队列 / 破音字表 v2（斜·分句末+麻韵锚定）/ 音色优选 / 朗读设置面板 | 59 | #58 |
| `tts-test-v3.mjs` | #54 P1-TTS 尾巴三项：句间停顿 / iOS 手势解锁 / 可插拔适配层 `TTS.*` 收口 | 17 | #54 |
| `review-test.mjs` | #57 温故：今日复习卡 / 本地日修 UTC 错位 / 超期降档 / leech / 无到期空态 | 25 | #57 |
| `audit-tts-rhyme.mjs` | 全量语料审计：麻韵证据排除「斜」后，斜→霞改写收敛为 10 处、2 处循环误伤消除 | 9 | #58 复核遗留 |

## 运行

```bash
npm run all      # 全套 110 断言
npm run tts      # 朗读相关 76 断言
npm run review   # 温故 25 断言
npm run audit    # 麻韵审计 9 断言
```

单独跑某个文件：

```bash
node tests/tts-test-v2.mjs
```

## 背景（为什么这些测试要入库）

- 灵玉 v1 复核发现破音字表「斜」全局替换造成 60+ 误伤；v2 返工收敛到 12 处，v2 复核又抓出
  **2 处循环论证误伤**（麻韵判据把「斜」自身当证据，致「全诗唯一麻韵字=斜」时自我满足）。
  `audit-tts-rhyme.mjs` 正是在全量语料上验证该根因已修复（12 → 10，且 10 处均有独立麻韵证据）。
- 此前测试脚本只存在于仓库外的临时目录（如 `D:/AgentHub/temp/wb-ui-review/`），换机/清理即失；
  本轮按复核意见统一入库，并在 README 记录运行方式，便于后来者复跑与交接。
- 旧版 `tts-test.mjs`（v1）断言写死 `[远上寒山石径斜→霞]`、`[野旷天低树→雅旷]`，在 v2 下必然失败，
  已在临时目录重命名为 `tts-test-v1-archived.mjs` 归档，未纳入本仓库，避免误导。
