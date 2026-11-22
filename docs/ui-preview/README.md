# BookCars UI 截图验证说明

本文说明如何对 BookCars 前台（frontend）、管理后台（admin）与移动端（mobile）的界面进行**可重复的截图验证**，以及每项自动断言的含义、判定标准与常见失败的排查方式。

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
| 3 | 控制台错误 | `console` 中 `type === 'error'` 数量 = 0 | 接口报错、Hook 违规、key 重复等运行时错误 |
| 4 | 关键元素 | 页面选择器全部命中 | 页面结构缺失（骨架屏未结束、组件未渲染） |
| 5 | 破图 | 所有本地 `<img>` 满足 `complete && naturalWidth > 0` | CDN 资源 404 / 路径错误导致的裂图 |
| 6 | 横向溢出 | `documentElement.scrollWidth <= clientWidth + 4` | 移动端或窄屏出现横向滚动条 |
| 7 | 头像兜底 | 记录 `span.supplier-avatar-fallback` 数量 | 供应商头像缺失时是否正确降级为字母徽标（**计数为 0 不算失败**，只作观测） |

补充说明：

* **懒加载图片**不计入破图——仅当图片 `complete === true` 且 `naturalWidth === 0` 才判定为裂图。
* **外站资源**（OpenStreetMap 瓦片、`react-circle-flags` 国旗等）在离线/受限网络下会被浏览器拦截，这类资源归入报告的「外站资源」清单，不计为失败。
* **容器溢出**（`main/section/article/.ws-body/.bs-list/table` 内部 `scrollWidth > clientWidth`）会记录在 JSON 详情中，用于排查卡片文字挤压。

---

## 5. 本轮修复（由本脚本发现）

| 问题 | 现象 | 修复 |
| --- | --- | --- |
| 种子数据引用了不存在的 CDN 文件 | `admin-users` / `admin-locations` 出现裂图（`supplier.png`、`location.png` 404） | 新增 `backend/scripts/img/{supplier,customer,location}.png` 占位资源；`backend/scripts/seed-dev.ts` 新增 `ensureSeedAsset()`，灌种时把头像/网点图真正写入 CDN 目录 |
| 后台头像/网点图无降级 | 图片缺失时直接显示浏览器裂图图标 | 新增 `admin/src/components/SafeImage.tsx` 与 `frontend/src/components/SafeImage.tsx`，统一 `onError` 降级为图标/占位块；后台 `admin/src/components/Avatar.tsx`、`admin/src/components/UserList.tsx`，前台 `frontend/src/components/Car.tsx`、`frontend/src/components/LocationCarrousel.tsx` 已接入 |
| 供应商头像缺失 | 结算页/列表页出现裂图 | 已有 `SupplierAvatar.tsx`（前后台各一份），缺失时渲染品牌色字母徽标 |
| 校验脚本误报 | 首轮 30/30 失败：选择器用了不存在的 `<main>`、破图判定把懒加载与外站资源算作失败 | 改用真实容器选择器 `.app` / `.site-header` / `.signin`；破图判定改为「已加载完且 naturalWidth=0」，外站资源单列 |

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
