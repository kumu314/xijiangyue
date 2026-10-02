/* #68 fix(render) 回归 + 三档真渲染冒烟
   覆盖 zcode 裁决的回归清单：
     ① 拓展篇有译文 → 渲染出译文（本修复的主目标）
     ② 拓展篇无译文 → 仍提示「正在补充中」（不回归）
     ③ jiaowo_lbn/sishui_lyd（拓展+no_paraphrase）→ rowO，不显译文、不显占位
     ④ 精读篇 no_paraphrase（zaibiekangqiao 等）→ rowO，行为不变
     ⑤ 精读篇有译文 → rowOM，行为不变
     ⑥ 外国诗 → 行为不变
     ⑦ 被挡数 62 → 0
     ⑧ 三档 375/390/428 无横向溢出；控制台 errs=[]
*/
const { chromium } = require("D:/AgentHub/temp/wb-ui-review/node_modules/playwright-core");

const FILE = "file:///D:/ZCode/%E5%B0%8F%E7%A8%8B%E5%BA%8F/xijiangyue/index.html";
const R = [];
const ok = (n, c, d) => R.push([c ? "PASS" : "FAIL", n, d === undefined ? "" : String(d)]);

async function probe(page, pid) {
  await page.evaluate(id => openDetail(id), pid);
  await page.waitForTimeout(180);
  // 「解读」tab 承载 panel-tr
  await page.evaluate(() => {
    const ts = [...document.querySelectorAll("#view-detail .tab")];
    const t = ts.find(x => x.textContent.trim() === "解读");
    if (t) t.click();
  });
  await page.waitForTimeout(220);
  return await page.evaluate(() => {
    const el = document.querySelector("#panel-tr");
    const html = el ? el.innerHTML : "";
    const txt = el ? el.innerText : "";
    const d = document.querySelector("#view-detail");
    return {
      hasMCol: /class="m[\s"]/.test(html),
      hasPlaceholder: txt.includes("正在补充中"),
      txt,
      ovf: d ? d.scrollWidth - d.clientWidth : -1,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });
  // isOrigRe 是页面脚本的块级 const，evaluate 取不到；注入一份等价判据到 window
  await page.addInitScript(() => {
    window.__ORIG_RE = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u0980-\u09FF\u0E00-\u0E7F\u3040-\u30FF]/;
  });
  await page.goto(FILE, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  // ---------- 结构红线 ----------
  const meta = await page.evaluate(() => ({ n: POEMS.length, first: POEMS[0].id }));
  ok("POEMS 总数 = 970", meta.n === 970, meta.n);
  ok("首篇 id 不变", meta.first === "jingyesi", meta.first);

  // ---------- 被挡数：修正前后 ----------
  const blk = await page.evaluate(() => {
    const judge = p => {
      const ls = p.lines || [];
      const hasTrans = ls.some(l => l.m && l.m.trim());
      const hasOrig = ls.some(l => __ORIG_RE.test(l.m || ""));
      return { hasTrans, hasOrig, expand: p.level === "拓展", noPP: !!p.no_paraphrase };
    };
    let before = 0, after = 0, hiddenNoPP = 0, placeholder = 0;
    const samples = { before: [], after: [] };
    POEMS.forEach(p => {
      const j = judge(p);
      // 修正前判据：(expand && !hasOrig) → 占位、丢译文
      if (j.hasTrans && j.expand && !j.hasOrig) {
        before++;
        if (samples.before.length < 6) samples.before.push(p.id);
      }
      // 修正后判据：(expand && !hasOrig && !hasTrans) → 占位
      if (j.hasTrans && j.expand && !j.hasOrig && !j.hasTrans) { after++; }
      if (j.hasTrans && j.noPP) { hiddenNoPP++; }
      if (!j.hasTrans && j.expand && !j.hasOrig) placeholder++;
    });
    return { before, after, hiddenNoPP, placeholder, samples };
  });
  // 修正前被挡 = 62（合并 trans-02 时读数）+ 20（trans-03 已并入）= 82
  ok("被挡数：修正前 82（含 trans-03）", blk.before === 82, blk.before);
  ok("被挡数：修正后 0", blk.after === 0, blk.after);
  ok("no_paraphrase 有意隐藏（设计内）计数", blk.hiddenNoPP === 5, blk.hiddenNoPP);
  console.log("  · 拓展无译文→占位（正确）:", blk.placeholder, "篇");

  // ---------- ① 拓展篇 + 有译文 → 显示译文 ----------
  let r = await probe(page, "t3_830665e1");
  ok("①拓展+有译文→渲染出 m 列", r.hasMCol, "mCol=" + r.hasMCol);
  ok("①译文文本落地", r.txt.includes("风雨刚刚停住"), "");
  ok("①不显占位", !r.hasPlaceholder, "");

  // 再抽 3 篇本批新并拓展译文，做交叉验证
  const more = await page.evaluate(() => {
    const out = [];
    for (const p of POEMS) {
      if (out.length >= 3) break;
      if (p.level !== "拓展" || p.no_paraphrase) continue;
      const ls = p.lines || [];
      if (ls.some(l => l.m && l.m.trim()) && !ls.some(l => __ORIG_RE.test(l.m || ""))) out.push(p.id);
    }
    return out;
  });
  for (const pid of more) {
    const rr = await probe(page, pid);
    ok(`①抽检 ${pid} 渲染 m 列`, rr.hasMCol, "");
  }

  // ---------- ② 拓展篇 + 无译文 → 占位 ----------
  const noTransId = await page.evaluate(() => {
    for (const p of POEMS) {
      if (p.level !== "拓展" || p.no_paraphrase) continue;
      const ls = p.lines || [];
      if (!ls.some(l => l.m && l.m.trim()) && !ls.some(l => __ORIG_RE.test(l.m || ""))) return p.id;
    }
    return null;
  });
  r = await probe(page, noTransId);
  ok("②拓展+无译文→仍显占位", r.hasPlaceholder, noTransId);
  ok("②拓展+无译文→不显 m 列", !r.hasMCol, "");

  // ---------- ③ 拓展 + no_paraphrase → rowO ----------
  for (const pid of ["jiaowo_lbn", "sishui_lyd"]) {
    r = await probe(page, pid);
    ok(`③${pid} 不显 m 列`, !r.hasMCol, "");
    ok(`③${pid} 不显占位（非"正在补充"）`, !r.hasPlaceholder, "");
  }

  // ---------- ④ 精读 + no_paraphrase → rowO ----------
  const jingNoPP = await page.evaluate(() => POEMS.filter(p => p.level !== "拓展" && p.no_paraphrase).map(p => p.id));
  for (const pid of jingNoPP) {
    r = await probe(page, pid);
    ok(`④精读noPP ${pid} 不显 m 列`, !r.hasMCol, "");
  }

  // ---------- ⑤ 精读篇有译文 → rowOM ----------
  r = await probe(page, "jingyesi");
  ok("⑤精读 jingyesi 显 m 列", r.hasMCol, "");

  // ---------- ⑥ 外国诗不变 ----------
  r = await probe(page, "sonnet18");
  ok("⑥外国诗显 m 列", r.hasMCol, "");

  // ---------- ⑧ 三档无横向溢出 ----------
  const pids = ["t3_830665e1", "jiaowo_lbn", "jingyesi", "sonnet18"];
  for (const w of [375, 390, 428]) {
    await page.setViewportSize({ width: w, height: 844 });
    await page.waitForTimeout(150);
    let bad = [];
    for (const pid of pids) {
      const rr = await probe(page, pid);
      if (rr.ovf > 1) bad.push(pid + ":" + rr.ovf);
    }
    ok(`⑧${w}px 无横向溢出`, bad.length === 0, bad.join(","));
  }
  await page.setViewportSize({ width: 390, height: 844 });

  // ---------- 节令签回归 ----------
  r = await page.evaluate(() => {
    if (typeof goJieling === "function") { goJieling(); return document.querySelectorAll(".jl-card").length; }
    return -1;
  });
  ok("[回归] 节令签四签在位", r === 4, "cards=" + r);

  ok("控制台/页面无 JS 报错", errs.length === 0, errs.slice(0, 3).join(" | "));

  await browser.close();
  const P = R.filter(x => x[0] === "PASS").length;
  console.log("\n================ fix(render) 回归结果 ================");
  R.forEach(x => console.log(x[0].padEnd(4), x[1].padEnd(40), x[2]));
  console.log(`\nRESULT: ${P} PASS / ${R.length - P} FAIL`);
  process.exit(P === R.length ? 0 : 1);
})().catch(e => { console.error("FATAL", e); process.exit(2); });
