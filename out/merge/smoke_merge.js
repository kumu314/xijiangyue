/* #68 合并真渲染冒烟：3 篇（新并串讲记忆 / 新并译文 / 外国诗）+ 全库红线 */
const { chromium } = require("D:/AgentHub/temp/wb-ui-review/node_modules/playwright-core");
const path = require("path");

const FILE = "file:///D:/ZCode/%E5%B0%8F%E7%A8%8B%E5%BA%8F/xijiangyue/index.html";
const R = [];
const ok = (n, c, d) => R.push([c ? "PASS" : "FAIL", n, d === undefined ? "" : String(d)]);

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); });

  await page.goto(FILE, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  // ---- 结构红线 ----
  const meta = await page.evaluate(() => ({
    n: POEMS.length,
    first: POEMS[0].id,
    last: POEMS[POEMS.length - 1].id,
    cats: CATS ? Object.keys(CATS).length : -1,
  }));
  ok("POEMS 总数 = 935", meta.n === 935, meta.n);
  ok("首篇 id 不变", meta.first === "jingyesi", meta.first);

  // 含有新并入内容的篇数
  const cov = await page.evaluate(() => {
    let sc = 0, memArr = 0, memV1 = 0, mFull = 0, mAny = 0;
    POEMS.forEach(p => {
      if (p["串讲"] && p["串讲"].length > 80) sc++;
      if (Array.isArray(p.memory) && p.memory.length) {
        if (p.memory.length === 1 && p.memory[0].t === "记忆技巧") memV1++;
        else memArr++;
      }
      const ls = p.lines || [];
      const withM = ls.filter(l => l.m && l.m.length > 3).length;
      if (withM === ls.length && withM > 0) mFull++;
      else if (withM > 0) mAny++;
    });
    return { sc, memArr, memV1, mFull, mAny };
  });
  console.log("coverage:", JSON.stringify(cov));

  // ---- 3 篇冒烟（先切到对应 tab，否则 tab 内容不渲染 → 假 FAIL）----
  const clickTab = async (label) => {
    await page.evaluate(lb => {
      const ts = [...document.querySelectorAll("#view-detail .tab")];
      const t = ts.find(x => x.textContent.trim() === lb);
      if (t) t.click();
    }, label);
    await page.waitForTimeout(250);
  };

  // 1) 新并串讲记忆：xf_8065f6a3 采薇（pilot-01）
  await page.evaluate(() => openDetail("xf_8065f6a3"));
  await page.waitForTimeout(200);
  await clickTab("记忆");
  let r = await page.evaluate(() => {
    const d = document.querySelector("#view-detail");
    const txt = d ? d.innerText : "";
    return {
      hasMem: txt.includes("两条抓手") || txt.includes("薇亦作止"),
      ovf: d ? (d.scrollWidth - d.clientWidth) : -1,
      len: txt.length,
    };
  });
  ok("[冒烟1/串讲记忆] 记忆卡渲染内容", r.hasMem, "len=" + r.len);
  await clickTab("串讲");
  r = await page.evaluate(() => {
    const d = document.querySelector("#view-detail");
    const txt = d ? d.innerText : "";
    return { hasSc: txt.includes("戍卒的归思") || txt.includes("杨柳依依"), ovf: d ? (d.scrollWidth - d.clientWidth) : -1 };
  });
  ok("[冒烟1/串讲记忆] 串讲渲染内容", r.hasSc);
  ok("[冒烟1/串讲记忆] 详情无横向溢出", r.ovf <= 1, "ovf=" + r.ovf);

  // 2) 新并译文：t3_830665e1 灞上秋居（qoder-01）
  await page.evaluate(() => openDetail("t3_830665e1"));
  await page.waitForTimeout(200);
  await clickTab("解读");
  r = await page.evaluate(() => {
    const d = document.querySelector("#view-detail");
    const txt = d ? d.innerText : "";
    return {
      hasM: txt.includes("灞原上风雨刚刚停住") || txt.includes("风雨刚刚停住"),
      hasO: txt.includes("灞原风雨定"),
      ovf: d ? (d.scrollWidth - d.clientWidth) : -1,
      len: txt.length,
    };
  });
  ok("[冒烟2/译文] 渲染出白话译文", r.hasM, "len=" + r.len);
  ok("[冒烟2/译文] 原文仍在", r.hasO);
  ok("[冒烟2/译文] 无横向溢出", r.ovf <= 1, "ovf=" + r.ovf);

  // 3) 外国诗：sonnet18
  r = await page.evaluate(() => {
    openDetail("sonnet18");
    const d = document.querySelector("#view-detail");
    const txt = d ? d.innerText : "";
    return {
      hasC: txt.includes("莎士比亚") || txt.includes("夏日"),
      len: txt.length,
      ovf: d ? (d.scrollWidth - d.clientWidth) : -1,
    };
  });
  ok("[冒烟3/外国诗] 正常渲染", r.hasC, "len=" + r.len);
  ok("[冒烟3/外国诗] 无横向溢出", r.ovf <= 1, "ovf=" + r.ovf);

  // 4) 竖排详情
  r = await page.evaluate(() => {
    openDetail("jingyesi");
    const d = document.querySelector("#view-detail");
    return { ovf: d ? d.scrollWidth - d.clientWidth : -1 };
  });
  ok("[冒烟4/竖排] 无横向溢出", r.ovf <= 1, "ovf=" + r.ovf);

  // 5) 节令签回归（上一刀）
  r = await page.evaluate(() => {
    if (typeof goJieling === "function") { goJieling(); return document.querySelectorAll(".jl-card").length; }
    return -1;
  });
  ok("[回归/节令签] 四签在位", r === 4, "cards=" + r);

  ok("控制台/页面无 JS 报错", errs.length === 0, errs.slice(0, 3).join(" | "));

  await browser.close();
  const P = R.filter(x => x[0] === "PASS").length;
  console.log("\n================ 冒烟结果 ================");
  R.forEach(x => console.log(x[0].padEnd(4), x[1].padEnd(34), x[2]));
  console.log(`\nRESULT: ${P} PASS / ${R.length - P} FAIL`);
  process.exit(P === R.length ? 0 : 1);
})().catch(e => { console.error("FATAL", e); process.exit(2); });
