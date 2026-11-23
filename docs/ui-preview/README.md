# BookCars UI 截图验证说明

本文说明如何对 BookCars 前台（frontend）、管理后台（admin）与移动端（mobile）的界面进行**可重复的截图验证**，以及每项自动断言的含义、判定标准与常见失败的排查方式。

---

## 0. 本地一键启动（完整流程）

以下步骤是本机实测可用的启动顺序，按顺序执行即可跑通全部 30 页。

### 0.1 前置依赖

| 依赖 | 版本 / 端口 | 说明 |
| --- | --- | --- |
| Node.js | 22.x | 前台 / 后台 / 后端 / 移动端均需 |
| Docker | — | 提供 MongoDB 副本集与 Redis |
| Python | `/opt/homebrew/bin/python3.14` | 跑截图验证脚本（需 `playwright`） |

### 0.2 启动 MongoDB（单节点副本集）与 Redis

```bash
docker run -d --name bookcars-local-mongo -p 37017:27017 mongo:7.0.12 --replSet rs0 --bind_ip_all
docker run -d --name bookcars-local-redis -p 36379:6379 redis:7

# 副本集必须初始化一次，否则事务与 booking 排他锁不可用
docker exec bookcars-local-mongo mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})'
```

### 0.3 启动本地 SMTP（邮件在本地不会真的发出，但必须能连通）

```bash
python3 -m smtpd -n -c DebuggingServer 127.0.0.1:32525
```

并在 `backend/.env` 中设置 `BC_SMTP_HOST=127.0.0.1`、`BC_SMTP_PORT=32525`、`BC_SMTP_USER`、`BC_SMTP_PASS`。

### 0.4 构建共享包（易踩坑，务必先做）

`packages/bookcars-helper` 的产物里带有 `:bookcars-types` / `:currency-converter` 这类路径别名，
必须由 `tsc-alias` 重写，否则后端启动会报：

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package ':bookcars-types'
```

```bash
cd packages/bookcars-types     && npm run build
cd packages/currency-converter && npm run build
cd packages/bookcars-helper    && npm run build
```

> 注意：只在 `backend/` 里执行 `tsc --build` **不会**修复别名，必须构建这三个包。

### 0.5 构建并启动后端

```bash
cd backend
npx tsc --build && npx babel dist -d dist
node --import ./dist/src/monitoring/instrument.js dist/src      # :4002
```

### 0.6 灌入开发种子数据

```bash
cd backend
NODE_ENV=development node dist/scripts/seed-dev.js
```

产出 3 辆车、1 个网点、3 个用户与 4 笔订单，并把车辆图片、供应商头像、网点图写入 CDN 目录。

### 0.7 启动前台与后台

```bash
cd frontend && npm run dev     # :33002
cd admin    && npm run dev     # :33001
```

### 0.8 运行截图验证

```bash
/opt/homebrew/bin/python3.14 __scripts/ui-verify.py
```

### 0.9 本地账号

| 端 | 账号 | 密码 |
| --- | --- | --- |
| 前台 | `dev-seed-customer@bookcars.ma` | `B00kC4r5` |
| 后台 | `admin@bookcars.ma` | `B00kC4r5` |

登录接口：`POST /api/sign-in/frontend`、`POST /api/sign-in/admin`（**不存在** `POST /api/users/login`）。

---

## 1. 快速开始

```bash
# 1) 启动依赖服务（本地示例：Mongo 副本集 + Redis）
docker run -d --name bookcars-local-mongo -p 37017:27017 mongo:7.0.12 --replSet rs0 --bind_ip_all
docker run -d --name bookcars-local-redis -p 36379:6379 redis:7

# 2) 启动后端 / 前台 / 后台（三个终端）
cd backend    && npm run build && node --import ./dist/src/monitoring/instrument.js dist/src   # :4002
cd frontend   && npm run dev                                                                     # :33002
cd admin      && npm run dev                                                                     # :33001

# 3) 灌入开发种子数据（含车辆图片、供应商头像、网点图）
cd backend && NODE_ENV=development node dist/scripts/seed-dev.js

# 4) 运行截图验证
/opt/homebrew/bin/python3.14 __scripts/ui-verify.py
```

脚本结束后：

| 产物 | 说明 |
| --- | --- |
| `docs/ui-preview/<页面名>.png` | 1440×900 桌面截图（`mobile-*.png` 为 390×844 @2x） |
| `docs/ui-preview/verify-report.md` | 人读报告：逐页结论表 + 失败明细 + 外站资源清单 |
| `docs/ui-preview/verify-report.json` | 机器可读结果，便于 CI 断言 |
| `docs/ui-preview/index.html` | 视觉走查画廊（浏览器打开 `python3 -m http.server 34001`） |

退出码：`0` 表示全部通过，`1` 表示存在失败页面（可直接用于 CI 卡点）。

---

## 2. 环境变量

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `FRONTEND_URL` | `http://localhost:33002` | 前台地址 |
| `ADMIN_URL` | `http://localhost:33001` | 后台地址 |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@bookcars.ma` / `B00kC4r5` | 后台登录账号 |
| `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD` | `dev-seed-customer@bookcars.ma` / `B00kC4r5` | 客户登录账号 |
| `OUT_DIR` | `docs/ui-preview` | 截图与报告输出目录 |
| `SKIP_MOBILE` | 未设置 | 设为 `1` 跳过移动端截图（快速回归用） |

> 注意：Vite dev server 默认只监听 IPv6 `::1`，请使用 `http://localhost` 而非 `http://127.0.0.1` 访问。
> Playwright 必须使用 `/opt/homebrew/bin/python3.14`（系统 Node 的 playwright 包存在 `Cannot read properties of undefined (reading 'playwright')` 问题）。

---

## 3. 覆盖范围（30 页）

**前台 · 未登录（11）**
`web-home` `/` · `web-locations` · `web-suppliers` · `web-faq` · `web-about` · `web-contact` · `web-privacy` · `web-signin` · `web-signup` · `web-search`（带取还车地点与日期的真实检索）

**前台 · 需登录（3）**
`web-bookings` · `web-notifications` · `web-settings`（以种子客户 `dev-seed-customer@bookcars.ma` 登录后访问）

**前台 · 结算（1）**
`web-checkout`：进入检索结果后自动点击首张卡片的 `.btn-book`，验证结算页真实渲染

**前台 · 移动端（2）**
`mobile-home` · `mobile-search`（390×844，deviceScaleFactor=2，触摸模拟）

**管理后台（14）**
`admin-dashboard` · `admin-bookings` · `admin-cars` · `admin-users` · `admin-suppliers` · `admin-locations` · `admin-settings` · `admin-notifications` · `admin-countries` · `admin-scheduler` · `admin-bank-details` · `admin-pricing` · `admin-about` · `admin-contact`

---

## 4. 自动断言与判定标准

每一页都会执行下列断言，**全部通过**才算该页 `✅ 通过`：

| # | 断言 | 判定 | 失败含义 |
| --- | --- | --- | --- |
| 1 | HTTP 状态 | `status == 200` | 路由不存在 / 服务异常 / 被重定向到错误页 |
| 2 | 运行时异常 | `pageerror` 数量 = 0 | 组件渲染时抛异常（白屏 / ErrorBoundary 触发） |
| 3 | 控制台错误 | 本地应用脚本产生的 `console` `type === 'error'` 数量 = 0 | 接口报错、Hook 违规、key 重复等运行时错误 |
| 4 | 关键元素 | 页面选择器全部命中 | 页面结构缺失（骨架屏未结束、组件未渲染） |
| 5 | 破图 | 所有本地 `<img>` 满足 `complete && naturalWidth > 0` | CDN 资源 404 / 路径错误导致的裂图 |
| 6 | 横向溢出 | `documentElement.scrollWidth <= clientWidth + 4` | 移动端或窄屏出现横向滚动条 |
| 7 | 头像兜底 | 记录 `span.supplier-avatar-fallback` 数量 | 供应商头像缺失时是否正确降级为字母徽标（**计数为 0 不算失败**，只作观测） |

补充说明：

* **懒加载图片**不计入破图——仅当图片 `complete === true` 且 `naturalWidth === 0` 才判定为裂图。
* **外站资源**（OpenStreetMap 瓦片、`react-circle-flags` 国旗等）在离线/受限网络下会被浏览器拦截，这类资源归入报告的「外站资源」清单，不计为失败。
* **第三方 console error** 按来源 URL 区分：来源不是本地地址的（如 `accounts.google.com`、`ssl.gstatic.com`）归入报告的「第三方 console error」清单，不计为失败；本地脚本产生的仍然算失败。
* **容器溢出**（`main/section/article/.ws-body/.bs-list/table` 内部 `scrollWidth > clientWidth`）会记录在 JSON 详情中，用于排查卡片文字挤压。

---

## 5. 本轮修复（由本脚本发现）

| 问题 | 现象 | 修复 |
| --- | --- | --- |
| 种子数据引用了不存在的 CDN 文件 | `admin-users` / `admin-locations` 出现裂图（`supplier.png`、`location.png` 404） | 新增 `backend/scripts/img/{supplier,customer,location}.png` 占位资源；`backend/scripts/seed-dev.ts` 新增 `ensureSeedAsset()`，灌种时把头像/网点图真正写入 CDN 目录 |
| 后台头像/网点图无降级 | 图片缺失时直接显示浏览器裂图图标 | 新增 `admin/src/components/SafeImage.tsx` 与 `frontend/src/components/SafeImage.tsx`，统一 `onError` 降级为图标/占位块；后台 `admin/src/components/Avatar.tsx`、`admin/src/components/UserList.tsx`，前台 `frontend/src/components/Car.tsx`、`frontend/src/components/LocationCarrousel.tsx` 已接入 |
| 供应商头像缺失 | 结算页/列表页出现裂图 | 已有 `SupplierAvatar.tsx`（前后台各一份），缺失时渲染品牌色字母徽标 |
| 校验脚本误报 | 首轮 30/30 失败：选择器用了不存在的 `<main>`、破图判定把懒加载与外站资源算作失败 | 改用真实容器选择器 `.app` / `.site-header` / `.signin`；破图判定改为「已加载完且 naturalWidth=0」，外站资源单列 |
| Google 登录按钮报 403 | `.env` 中 `VITE_BC_GG_APP_ID=XXXXXXXXXX` 为占位值，GSI 向 `accounts.google.com` 请求按钮 iframe 被拒 | `frontend/src/components/SocialLogin.tsx` 新增 `isConfigured()`，未配置真实凭据的渠道直接不渲染按钮；校验脚本同时把第三方来源的 console error 单列，不再误判页面失败 |

---

## 6. 人工走查清单

自动化断言不能覆盖视觉质感，建议在 `docs/ui-preview/index.html` 画廊中逐页确认：

1. **品牌一致**：主色 `#214c3c`、画布 `#f8f8f3`（后台 `#f3f6f2`）、描边 `#e2e9df`、正文 `#193329`/`#4d6057`/`#7b8d84`。
2. **排版层级**：标题使用衬线体（Georgia / Noto Serif CJK SC / Songti SC），正文无衬线；字号与行高成体系。
3. **卡片与阴影**：圆角 16–20px，阴影 `0 8–18px rgb(26 54 39 / 5–10%)`，无重边框与「灰底框」。
4. **状态色**：void `#e6eae4`、pending `#fbe6cc`、deposit `#d7ecdf`、paid `#d9efdd`、paidInFull `#214c3c`、reserved `#d9e7f4`、cancelled `#f7dedc`。
5. **空态与加载态**：列表为空、接口失败时不是白屏。
6. **响应式**：390px 宽下前台首页与检索页无横向滚动、按钮可点、字号不溢出。

---

## 7. 常见问题排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `pageerror` 报 `TypeError: Cannot read properties of undefined` | 后端未启动，接口未连通 | 启动 backend，确认 `curl http://localhost:4002/api/settings` 返回 200 |
| 大量 `console error: Failed to load resource` | 登录失败，所有接口 401 | 确认种子账号密码，或先执行 `seed-dev.js` |
| 破图集中出现在 `cars`/`locations` | CDN 根目录为空 | 重新执行 `NODE_ENV=development node dist/scripts/seed-dev.js` |
| 页面全是 404 白屏 | Vite 只监听 `::1` | 改用 `http://localhost:<port>` |
| Playwright 报 `Cannot read properties of undefined (reading 'playwright')` | 误用了系统 Node 的 playwright | 改用 `/opt/homebrew/bin/python3.14` |
| 后端启动报 `Cannot find package ':bookcars-types'` | `packages/*` 未用 `tsc-alias` 构建，别名没被重写 | 依次执行 `packages/bookcars-types`、`packages/currency-converter`、`packages/bookcars-helper` 的 `npm run build` |
| 邮件相关接口超时 | 本地没有 SMTP 服务 | 启动 `python3 -m smtpd -n -c DebuggingServer 127.0.0.1:32525`，并在 `backend/.env` 指向它 |

---

## 8. 纳入 CI

```yaml
- name: UI screenshot verification
  run: |
    python3.14 __scripts/ui-verify.py
  env:
    FRONTEND_URL: http://localhost:33002
    ADMIN_URL: http://localhost:33001
```

脚本以退出码表示结果：`0` 全通过，`1` 存在失败页面。失败时 `docs/ui-preview/verify-report.md` 的「失败明细」小节会给出每个失败页的具体原因、缺失选择器、破图 URL 与控制台错误原文。
