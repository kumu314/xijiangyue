# #279 ⑧ 竖排诗句不全 —— 复现与根因定位

**日期**：2026-11-01
**作者**：灵玉
**性质**：诊断（只读，未改任何产品代码）
**前置**：trae 两轮失败（第一轮步数耗尽、第二轮盲扫 2MB 文件后 stalled），改由灵玉直接诊断

---

## 一、结论

**已复现，12/16 例档组合存在裁字**，一首 24–32 字的绝句被裁掉 6–12 字（1/4 到 1/2）。

根因是一处**判据与度量方向错位**：`renderVbody` 用 `offsetWidth` 反推「这一句折成了几列」，但竖排下 `.vline` 的宽度不随内容增长（高度被容器锁死、内容直接溢出），所以量出来永远是 1 列 → 切分分支不触发 → 长句不切 → 溢出部分被 `.vscroll{overflow-y:hidden}` 裁掉。

---

## 二、复现读数

环境：Chromium / 390×844 / `file://` 打开 `index.html` / 竖排 / 四档字号。
判据：`每列字数 × 实测行高 ≤ 可用高度（288px = 300 − padding 6×2）`。
为什么用这个判据而不是量元素高度——见第四节。

| 字号 | 行高 | 单列容量 | 夜雨寄北(16字/行) | 春晓(12字/行) | 静夜思(12字) | 登鹳雀楼(12字) |
|---|---|---|---|---|---|---|
| 小 | 30px | 9 字 | ✗ 16字/列，共裁 14 | ✗ 共裁 6 | ✗ 共裁 6 | ✗ 共裁 6 |
| 中 | 36px | 8 字 | ✓ 8字/列，刚好 | ✗ 共裁 8 | ✗ 共裁 8 | ✗ 共裁 8 |
| 大 | 42px | 6 字 | ✗ 共裁 8 | ✗ 共裁 12 | ✗ 共裁 12 | ✗ 共裁 12 |
| 特大 | 48px | 6 字 | ✗ 共裁 8 | ✓ 6字/列 | ✓ | ✓ |

（分母 = 4 例 × 4 档 = 16 个组合，逐组合实测，非抽样。分子 = 12 个存在 `字数×行高 > 288` 的组合。裁字数为该例全部列的合计。）

**注意「小」档最严重**：16 字/列 × 30px = 480px，超 288px 达 192px，一列丢 7 字、两列共丢 14 字——夜雨寄北 32 字只剩 18 字可读。

---

## 三、根因链（三层）

### 第 1 层：切分分支不触发

`index.html` L70596–70618：

```js
function renderVbody(bodyEl, texts, id, off, vertical){
  bodyEl.innerHTML=renderMaskLines(texts,id,off,false);   // pass1：不切分
  const unit=vColUnit();
  const kids=[...bodyEl.children];
  let cap=Infinity;
  if(kids.some(el=>el.offsetWidth===0)) cap=vColCapacity();
  else kids.forEach((el,i)=>{
    const cols=Math.round(el.offsetWidth/unit);           // ← 这里
    if(cols>=2){                                          // ← 条件
      const n=[...texts[i]].length;
      if(n>0) cap=Math.min(cap, Math.ceil(n/cols));
    }
  });
  if(isFinite(cap)){ ...pass2... }
}
```

`cols` 假设「长句会折成多列、元素随之变宽」。实测不成立：

```
夜雨寄北 小档：li=0 16字 w=49 h=288
```

`w=49 ≈ unit`（1 列宽），`h=288` 正好等于容器可用高度。**内容并没有折列，而是被高度截断后溢出**。所以 `cols=1`，`cols>=2` 不成立，`cap` 保持 `Infinity`，**pass2 整个跳过**。

### 第 2 层：溢出不报错、只被裁

```css
.vscroll{flex:1 1 auto;overflow-x:auto;overflow-y:hidden;}  /* L164 ← y 方向裁 */
.vbody{writing-mode:vertical-rl;height:300px;...}           /* L166 ← 列高锁死 */
.vline{...}                                                  /* L167 ← 无高度约束 */
```

`.vline` 在竖排下作为块级子元素，高度被容器钳到 288px，内容超出后 `overflow:visible` 溢出，但祖先 `.vscroll` 的 `overflow-y:hidden` 把它裁掉。**DOM 里字都在，`textContent` 完整，只是看不见**——所以任何「文本是否完整」的断言都会通过。

### 第 3 层：兜底公式也偏大

```js
function vColCapacity(){                                     // L70540
  const fs=parseFloat(FONT_SIZE_MAP[f.size]||"18px");
  return Math.max(4, Math.floor((300-VBODY_PAD_V)/(1.5*fs))-1);
}
```

用 `1.5×fs` 估算行高，实测行高是 `2.0×fs`（小档 1.875×）。于是兜底容量偏大：

| 字号 | 公式算出 | 实际容量 | 差 |
|---|---|---|---|
| 小 (16px) | 11 字 | 9 字 | +2 |
| 特大 (24px) | 7 字 | 6 字 | +1 |

即使走到兜底路径，仍会溢出。

---

## 四、r7 §B 为什么是假绿

`tests/r7-texture-test.mjs` §B 的断言：

```js
const wrapped = lines.filter(el => el.offsetWidth > unit + 2).length;
ok('四档字号竖排均无残留折行（wrapped=0）', perSize.every(x => x.wrapped === 0));
```

**量的是宽度，而 bug 在高度。** 竖排下 `.vline` 的宽度恒为 1 列，这个断言永远 `wrapped=0`，与是否裁字无关。

这与本次另一处发现同型：判据测的是「自己最容易满足的那个维度」，不是「缺陷实际发生的那个维度」。

---

## 五、另一个隐藏问题：续列容量比首列小

```css
.vline.vcont{border-block-start:none;padding-top:.9em;...}   /* L171 */
```

续列顶部缩进 `0.9em`，可用高度从 288px 降到 `288 − 0.9×fs`：

| 字号 | 首列容量 | 续列容量 |
|---|---|---|
| 小 16px | 9 字 | 9 字（273.6/30=9.1） |
| 特大 24px | 6 字 | **5 字**（266.4/48=5.55） |

**同一句切成同长度的片段，续列会先溢出。** 修复时若只用统一 `cap`，特大档仍会裁 1 字。

---

## 六、修法（三选一）

### 方案 A：cap 改用实测行高直算（推荐）

```js
// 用 getComputedStyle 实测行高，不依赖 offsetWidth 折列
const lhPx = parseFloat(getComputedStyle(kids[0]).lineHeight) || (2 * fs);
const padTop = /* 续列 0.9em，仅续列需要 */ 0.9 * fs;
const capFirst = Math.floor(288 / lhPx);
const capCont  = Math.floor((288 - padTop) / lhPx);
const cap = Math.max(4, Math.min(capFirst, capCont));
```

- 代价：`cap` 变成全诗统一值，不再逐句自适应——短句本来就不切，无影响
- 失败模式：若某档字体 fallback 导致行高非整数，`floor` 会保守 1 字（安全方向）
- 回滚：单函数改动，`git revert` 即回

### 方案 B：给 `.vline` 加 `max-height:288px` 让浏览器自己折列

- 代价：折列后 `.vline` 变宽，`data-li` 与 `vcont` 的归属逻辑要重做（一个 `.vline` 跨多列，点击/朗读会串行）
- 失败模式：改动面从 1 个函数扩到渲染 + 事件委托 + 朗读三处
- 不推荐：这正是 L70523 注释里 #199 想避免的

### 方案 C：`.vscroll` 改 `overflow-y:auto`

- 代价：竖排出现竖向滚动条，破坏手卷视觉；且用户要滚两次（横向 + 纵向）
- 失败模式：治标，字仍然被挤出容器，只是能滚到
- 只在 A 来不及时的止血选项

### 基线：不修的代价

用户在大字号下读到的诗**缺 1/4 到 1/2**，且不会报错、不会缺 DOM、任何文本完整性断言都通过。这是「静默错」——最危险的一类，因为没有任何机制会把它报出来。维持现状是合法选项，但需要明确接受「大字号用户看到的是残诗」。

---

## 七、建议新增的判据（可复用）

把 r7 §B 的宽度断言换成高度断言：

```js
// 每列字数 × 实测行高 ≤ 容器可用高
const lhPx = parseFloat(getComputedStyle(line).lineHeight);
const avail = body.clientHeight - 12;
const over = [...document.querySelectorAll('.vbody .vline')]
  .filter(el => [...el.textContent].length * lhPx > avail + 1);
ok('竖排每列字数不超出列高', over.length === 0, over.length);
```

**为什么这个判据有效而旧的无效**：它测的是「内容需要的高度 vs 容器给的高度」，是缺陷发生的那个维度；旧的测「元素宽度是否超出单列宽」，而元素宽度恒等于单列宽，永远通过。

---

## 八、覆盖声明与失效边界

**覆盖**：
- 四例（夜雨寄北/春晓/静夜思/登鹳雀楼）× 四档字号 = 16 组合，逐组合实测，非抽样
- 竖排、390×844 视口、默认遮字档
- 代码侧读到 L164–171 CSS、L70518–70618 渲染函数全文

**不覆盖**：
- 未测横排（`layout-horizontal`）——CSS 里 `height:auto`，理论上不受影响，但未实测
- 未测遮字档（`lv>=4` 全遮）与朗读态
- 未测长调（如《湘夫人》44 列）——短句已复现，长调只会更严重，但未取数
- 未测桌面端 / 平板档（`mode-desktop` / `mode-tablet` 下 `.vbody` 宽度不同）

**失效边界**：
- 读数绑定「可用高度 288px」。若改 `.vbody` 的 `height`，容量表全部要重算
- 绑定行高 `2.0×fs`（小档 1.875×）。若改 `--reader-lh`，容量表作废
- 本报告是诊断，**未修改任何产品代码**，`index.html` 零 diff

**复现脚本**：`out/review-tools/diag-vertical-clip.mjs`（随本报告提交）
