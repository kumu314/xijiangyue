# #50 Turso 线上持久化终验 —— **FAIL**（风险卡 #1133 不可关闭）

- 复核人：灵玉（lingyu）｜日期：2026-10-01｜关卡：#1133
- 对象：线上 `https://xijiangyue.onrender.com`（backend 47add0e 后的 Turso 双模式）
- 结论：**线上休眠后数据仍然丢失 → Turso 未在线上生效 → 判定 FAIL，风险卡 #1133 保持 open。**
- 脚本：`D:/AgentHub/temp/wb-turso-e2e/live-persist.mjs`｜日志：`live-persist-real.log`

---

## 一、实测读数（20 分钟静默，跨过 Render 免费档 15 分钟休眠阈值）

| 时刻 (UTC) | 操作 | 读数 |
|---|---|---|
| 15:38:04 | health | 200（首字节 1938ms，热） |
| 15:38:05 | 登录（phoneA=19969085001） | 200，token 载荷 uid = **5** |
| 15:38:06 | PUT progress `learned=8888, streak=42` | 200 |
| 15:38:07 | PUT checkin 当日四项 | 200 |
| 15:38:08 | GET me（写后立即读回） | 200，learned=8888 / streak=42 / checkin 完整 ✅ |
| **（静默 20 分钟，期间不触碰服务）** | | |
| 15:58:08 | health | 200（首字节 5449ms，较热态升高） |
| 15:58:09 | **GET me（同一 token）** | **401 `{"ok":false,"error":"用户不存在"}`** ❌ |
| 15:58:10 | 新用户登录（phoneB） | 200，**uid = 1** ❌ |

## 二、判定与根因

**两条独立判据同时失败**：
1. **判据 A**：休眠后同一 token 访问 `/api/me` 返回 **401「用户不存在」** —— `users` 表已空，账号消失。
2. **判据 B**：休眠前 uid = **5**，休眠后新用户 uid = **1** —— **AUTOINCREMENT 归零 = 数据库被重建**（若 Turso 生效，uid 应 ≥6 且递增）。

→ **与 Turso 改造前的症状完全一致**（`out/persist-memo.md` 记录的「17 分钟休眠后 learned 归 0、uid 归 1」）。**这次修复没有在线上生效。**

**根因（证据链）**：`render.yaml` 第 3 行自己写明——
> 在 Render 服务环境变量里配置 TURSO_URL / TURSO_TOKEN 即启用；**不配置则回退本地 sqlite（免费档会丢数据）**。

而 `render.yaml` 的 `envVars` **只声明了 `PORT` / `SECRET` / `DATA_DIR` 三项，没有 `TURSO_URL`、没有 `TURSO_TOKEN`**。
→ `USE_TURSO = Boolean(TURSO_URL && TURSO_TOKEN)` = **false** → 回退 `node:sqlite` 本地文件 → 重启即清空。

**代码侧没问题**：sha 对齐复核已 PASS（blob `6bae12f8…`，wrapper 三处正确，契约测试 51/51），zcode #1448 的安全复核也确认代码在 Turso 版本。**问题纯在部署配置**：Turso 凭据没有配到 Render 服务上。

> 两种可能，需小羽在 Render 控制台确认（两者症状相同）：
> (1) 新代码已部署、但**环境变量未配** → sqlite 回退（最可能）；
> (2) 新代码**根本没部署**（部署失败/未触发）。
> 判据：看 Render 服务的 Deploy 日志最新一次 commit 是不是 ≥47add0e，以及 Environment 页有没有 `TURSO_URL` / `TURSO_TOKEN`。

## 三、★ 自我更正（我上一条 note #1422 写错了）

我在 #1422 写：「冒烟已 15/15 通过，且新用户 uid 递增 3→4→5 —— 线上确为持久库（非 sqlite 归零），判据 B 已先验成立。」

**这条是错的，我收回。** uid 3→4→5 是在**同一次容器存活期内**（间隔几十秒、无重启）发生的，**只能说明"这次没重启"**，不能证明任何持久性。**真正的判据 B 必须跨重启观测**——本次跨了，读数是 5 → **1**，直接推翻。

**方法学教训**：验证"持久化"类需求时，**任何未跨"重启/休眠/重部署"边界的读数都无判别力**。同会话内的自增、写入后立即读回，都只能证明"当前这次进程正常"，不能证明"数据活着"。**只认跨边界的那一次读数。**

## 四、复验清单（配好环境变量后我重跑，无需改代码）

1. 在 Render 服务 Environment 配 `TURSO_URL`（`https://<db>-<org>.turso.io`）与 `TURSO_TOKEN`；
2. 触发一次重部署（让新 env 生效）；
3. 告知我，我重跑 `live-persist.mjs <base> 1200`；
4. **通过判据**（三条全中才算过）：① 休眠后同一 token `/api/me` 仍 200 且 learned/streak/checkin 全在；② 休眠后新用户 uid **> 休眠前 uid**（递增，非归 1）；③ 休眠后首字节出现冷启动特征（>8s）。
5. 三条全过，我才关 #1133。

> 注：判据 ③ 是"确认真的休眠过"的证据——若服务没休眠，测试无判别力（见第三节教训）。本次首字节 5449ms 虽未达 14s 级冷启动，但 uid 归 1 已独立证明库被重建，故 FAIL 成立。
