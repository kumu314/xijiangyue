# 西江阅·诗笺 后端

零依赖 Node 服务（>= 24，使用内置 `node:sqlite`），负责账号登录与学习进度云同步，并可同源托管前端静态文件。

## 本地运行

```bash
node backend/server.js            # 默认 127.0.0.1:8787（被占用则 PORT=8899）
# 打开 http://127.0.0.1:8899/ 即整站 + API
```

数据库自动落在 `backend/data.sqlite`（已 gitignore）。

## 环境变量

| 变量 | 作用 |
|---|---|
| `PORT` | 监听端口（默认 8787） |
| `SECRET` | 令牌签名密钥（不设则每次重启随机生成，所有登录态失效；生产必设） |
| `DATA_DIR` | sqlite 存放目录（默认 backend/） |
| `SMS_PROVIDER_URL` / `SMS_PROVIDER_KEY` | 配置后验证码走真实短信（POST JSON `{phone, code}`，Bearer 鉴权）；不配置为 dev 模式，验证码直接返回给前端并自动填入 |
| `WX_APPID` / `WX_SECRET` | 配置后 `/api/auth/third` 支持小程序 `wx.login` 的 code 换 openid（code2session） |

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/phone/request` | `{phone}` 发送验证码（60s 重发限流、IP 10 次/时） |
| POST | `/api/auth/phone/verify` | `{phone, code}` 返回 `{token, user}` |
| POST | `/api/auth/third` | `{provider, openid}` 或 `{provider:"微信", code}`（需 WX 配置） |
| GET | `/api/me` | 用户 + 进度 + 打卡（Bearer） |
| PUT | `/api/progress` | `{learned, streak}`（Bearer） |
| PUT | `/api/checkin` | `{date, done, counted}`（Bearer） |

令牌为 HMAC-SHA256 签名，30 天有效。CORS 已放开（回显 Origin），供 GitHub Pages 前端跨域调用。

## 前端接入

`index.html` 中 `API_BASE = localStorage.getItem("xjy_api_base") || ""`：

- 留空 = 纯本地模式，行为与旧版完全一致（未登录也能玩）；
- 部署后端后，把后端地址写进这一行（或让用户设备 `localStorage.setItem("xjy_api_base", "https://你的域名")`）；
- 登录后打卡/进度自动防抖上云；启动时拉取云端，较新则采纳；断网自动退回本地模式。

## 部署建议

任何能常驻跑 Node 24 的地方都行（VPS + `systemd`/`pm2`、宝塔、云函数容器等）：

```bash
SECRET=$(openssl rand -hex 32) PORT=8787 node backend/server.js
```

建议前面挂一层 Nginx/Caddy 做 HTTPS。小程序端联调时再把域名加进微信后台 request 合法域名列表。
