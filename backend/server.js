/* =========================================================
   西江阅·诗笺 后端服务（零依赖，Node >= 24）
   ---------------------------------------------------------
   能力：
   - 手机号验证码登录（dev 模式验证码直接返回；配置 SMS_* 后走真实短信）
   - 第三方登录占位（网页演示直接传 openid；小程序端接 wx.login 时配置 WX_APPID/WX_SECRET 走 code2session）
   - 学习进度 / 每日打卡 云同步（HMAC Bearer 令牌鉴权）
   - 同源托管前端静态文件（本地一条命令跑通整站演示）
   运行：node backend/server.js        （数据落 backend/data.sqlite）
   配置：PORT / SECRET / SMS_PROVIDER_URL / SMS_PROVIDER_KEY / WX_APPID / WX_SECRET
   ========================================================= */
"use strict";
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT || 8787);
const SECRET = process.env.SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.SECRET) console.warn("[warn] 未设置 SECRET 环境变量，已生成临时密钥：服务重启后所有登录令牌失效");
const ROOT = path.resolve(__dirname, "..");
const DB_PATH = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, "data.sqlite") : path.join(__dirname, "data.sqlite");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true }); // DATA_DIR 指向的目录不存在时自动创建
/* CORS 白名单：线上前端（GitHub Pages）。本地同源托管无 Origin 头不受影响；额外环境用逗号分隔 ALLOW_ORIGINS 追加 */
const ALLOW_ORIGINS = (process.env.ALLOW_ORIGINS || "https://kumu314.github.io").split(",").map(s => s.trim()).filter(Boolean);

/* ---------- 数据库 ---------- */
const db = new DatabaseSync(DB_PATH);
db.exec(`
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE, provider TEXT, openid TEXT, name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS codes(
  phone TEXT PRIMARY KEY, code TEXT, exp INTEGER, sent_at INTEGER
);
CREATE TABLE IF NOT EXISTS progress(
  user_id INTEGER PRIMARY KEY, learned INTEGER DEFAULT 0, streak INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS checkin(
  user_id INTEGER PRIMARY KEY, date TEXT, done TEXT DEFAULT '{}', counted TEXT DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

/* ---------- 工具 ---------- */
const nowISO = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const sign = (payloadB64) => crypto.createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
const TOKEN_TTL = 30 * 24 * 3600; // 30 天

function issueToken(uid) {
  const payload = b64u(JSON.stringify({ uid, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL }));
  return payload + "." + sign(payload);
}
function verifyToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [p, s] = token.split(".");
  const expect = sign(p);
  if (s.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expect))) return null;
  try {
    const data = JSON.parse(Buffer.from(p, "base64url").toString());
    return data.exp > Date.now() / 1000 ? data : null;
  } catch { return null; }
}

/* 服务端对外请求：仅 http/https，拒绝内网/保留地址（发短信、微信 code2session 用） */
function assertPublicHttpUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new Error("bad url"); }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("scheme not allowed");
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("host not allowed");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) || (a === 169 && b === 254) || a >= 224) throw new Error("host not allowed");
  }
  if (host === "::1" || host === "[::1]") throw new Error("host not allowed");
  return u;
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(new Error("body too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

/* 简单内存限流：按 key 计数（验证码重发、IP 维度粗防） */
const buckets = new Map();
function rateLimit(key, max, windowMs) {
  const t = Date.now();
  const b = buckets.get(key) || [];
  const fresh = b.filter((x) => t - x < windowMs);
  if (fresh.length >= max) return false;
  fresh.push(t); buckets.set(key, fresh);
  return true;
}

/* ---------- 短信（dev 模式直接回显验证码） ---------- */
async function sendSms(phone, code) {
  const url = process.env.SMS_PROVIDER_URL, key = process.env.SMS_PROVIDER_KEY;
  if (!url || !key) return { dev: true, code };
  const target = assertPublicHttpUrl(url); // 校验后才发出
  const r = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ phone, code, template: "西江阅验证码：" + code }),
  });
  if (!r.ok) throw new Error("sms provider " + r.status);
  return { dev: false };
}

/* ---------- 业务路由 ---------- */
async function route(req, res, url) {
  const P = url.pathname;

  if (P === "/api/health" && req.method === "GET") return json(res, 200, { ok: true, time: nowISO() });

  /* 手机号登录：第一步请求验证码 */
  if (P === "/api/auth/phone/request" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    const phone = String(body.phone || "");
    if (!/^1\d{10}$/.test(phone)) return json(res, 400, { ok: false, error: "手机号格式不对" });
    if (!rateLimit("req:" + phone, 1, 60 * 1000)) return json(res, 429, { ok: false, error: "发送太频繁，稍后再试" });
    if (!rateLimit("ip:" + req.socket.remoteAddress, 10, 3600 * 1000)) return json(res, 429, { ok: false, error: "请求过多" });
    const code = String(crypto.randomInt(0, 1e6)).padStart(6, "0");
    db.prepare("INSERT OR REPLACE INTO codes(phone,code,exp,sent_at) VALUES(?,?,?,?)")
      .run(phone, code, Date.now() + 5 * 60 * 1000, Date.now());
    const r = await sendSms(phone, code);
    return json(res, 200, r.dev ? { ok: true, dev_code: code } : { ok: true });
  }

  /* 手机号登录：第二步校验 */
  if (P === "/api/auth/phone/verify" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    const phone = String(body.phone || ""), code = String(body.code || "");
    const row = db.prepare("SELECT code, exp FROM codes WHERE phone=?").get(phone);
    if (!row || row.code !== code || row.exp < Date.now()) return json(res, 401, { ok: false, error: "验证码错误或已过期" });
    db.prepare("DELETE FROM codes WHERE phone=?").run(phone);
    db.prepare("INSERT OR IGNORE INTO users(phone) VALUES(?)").run(phone);
    const user = db.prepare("SELECT id, phone, name FROM users WHERE phone=?").get(phone);
    if (!user.name) db.prepare("UPDATE users SET name=? WHERE id=?").run(phone.slice(-4) + "诗友", user.id);
    return json(res, 200, { ok: true, token: issueToken(user.id), user: { type: "手机号", phone, name: user.name || phone.slice(-4) + "诗友" } });
  }

  /* 第三方登录占位：网页演示直接带 openid；小程序端应传 wx.login 的 code，
     配置 WX_APPID/WX_SECRET 后这里用 code2session 换 openid（走 assertPublicHttpUrl 出网） */
  if (P === "/api/auth/third" && req.method === "POST") {
    const body = JSON.parse((await readBody(req)) || "{}");
    const provider = String(body.provider || "");
    if (!["微信", "QQ"].includes(provider)) return json(res, 400, { ok: false, error: "unknown provider" });
    let openid = body.openid;
    if (body.code && process.env.WX_APPID && process.env.WX_SECRET && provider === "微信") {
      const u = assertPublicHttpUrl("https://api.weixin.qq.com/sns/jscode2session");
      const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appid: process.env.WX_APPID, secret: process.env.WX_SECRET, js_code: body.code, grant_type: "authorization_code" }) });
      const d = await r.json();
      if (!d.openid) return json(res, 401, { ok: false, error: "微信授权失败" });
      openid = d.openid;
    }
    if (!openid) return json(res, 400, { ok: false, error: "缺少 openid（网页演示请本地登录）" });
    db.prepare("INSERT OR IGNORE INTO users(provider, openid) VALUES(?,?)").run(provider, String(openid));
    const user = db.prepare("SELECT id FROM users WHERE provider=? AND openid=?").get(provider, String(openid));
    return json(res, 200, { ok: true, token: issueToken(user.id), user: { type: provider, name: provider + "用户" } });
  }

  /* —— 以下需登录 —— */
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = verifyToken(token);
  if (!payload) return json(res, 401, { ok: false, error: "登录已过期" });
  const uid = payload.uid;

  if (P === "/api/me" && req.method === "GET") {
    const user = db.prepare("SELECT phone, provider, name FROM users WHERE id=?").get(uid);
    if (!user) return json(res, 401, { ok: false, error: "用户不存在" });
    const prog = db.prepare("SELECT learned, streak, updated_at FROM progress WHERE user_id=?").get(uid) || { learned: 0, streak: 0, updated_at: "" };
    const chk = db.prepare("SELECT date, done, counted, updated_at FROM checkin WHERE user_id=?").get(uid) || null;
    return json(res, 200, { ok: true, user, progress: prog, checkin: chk });
  }

  if (P === "/api/progress" && req.method === "PUT") {
    const b = JSON.parse((await readBody(req)) || "{}");
    const learned = Math.max(0, Math.min(9999, Number(b.learned) || 0));
    const streak = Math.max(0, Math.min(9999, Number(b.streak) || 0));
    db.prepare(`INSERT INTO progress(user_id, learned, streak, updated_at) VALUES(?,?,?,?)
                ON CONFLICT(user_id) DO UPDATE SET learned=excluded.learned, streak=excluded.streak, updated_at=excluded.updated_at`)
      .run(uid, learned, streak, nowISO());
    return json(res, 200, { ok: true });
  }

  if (P === "/api/checkin" && req.method === "PUT") {
    const b = JSON.parse((await readBody(req)) || "{}");
    const date = String(b.date || ""), done = JSON.stringify(b.done || {}), counted = JSON.stringify(b.counted || {});
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(res, 400, { ok: false, error: "date 格式不对" });
    db.prepare(`INSERT INTO checkin(user_id, date, done, counted, updated_at) VALUES(?,?,?,?,?)
                ON CONFLICT(user_id) DO UPDATE SET date=excluded.date, done=excluded.done, counted=excluded.counted, updated_at=excluded.updated_at`)
      .run(uid, date, done, counted, nowISO());
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { ok: false, error: "not found" });
}

/* ---------- 静态文件（同源托管前端，方便本地演示） ---------- */
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
function serveStatic(res, urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p === "/" || p === "") p = "/index.html";
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end("not found"); }
  const data = fs.readFileSync(file);
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Content-Length": data.length });
  res.end(data);
}

/* ---------- 服务器 ---------- */
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOW_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname.startsWith("/api/")) return await route(req, res, url);
    if (req.method === "GET") return serveStatic(res, url.pathname);
    return json(res, 404, { ok: false, error: "not found" });
  } catch (e) {
    console.error("[err]", url.pathname, e.message);
    if (!res.headersSent) return json(res, 500, { ok: false, error: "server error" });
  }
});
server.listen(PORT, () => console.log(`西江阅后端已启动: http://127.0.0.1:${PORT}  (静态同源托管 /  API /api/*)`));
