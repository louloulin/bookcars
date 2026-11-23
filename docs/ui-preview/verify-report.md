# BookCars UI 截图验证报告

- 生成时间：2026-11-23 11:43:58
- 前台：http://localhost:33002　后台：http://localhost:33001
- 用时：133.1s　页面数：30　通过：30　失败：0

| 页面 | 分组 | HTTP | pageerror | console error | 第三方 console | 破图 | 外站拦截 | 横向溢出 | 兜底头像 | 结论 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| web-home.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-locations.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-suppliers.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-faq.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-about.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-contact.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-privacy.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-signin.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-signup.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-search.png | frontend-public | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-checkout.png | frontend-checkout | 200 | 0 | 0 | 4 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-bookings.png | frontend-auth | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-notifications.png | frontend-auth | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| web-settings.png | frontend-auth | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| mobile-home.png | frontend-mobile | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| mobile-search.png | frontend-mobile | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-dashboard.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-bookings.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-cars.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-users.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-suppliers.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-locations.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-settings.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-notifications.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-countries.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-scheduler.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-bank-details.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-pricing.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-about.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |
| admin-contact.png | admin | 200 | 0 | 0 | 0 | 0 | 0 | 无 | 0 | ✅ 通过 |

## 第三方 console error（未计入失败）

来自 Google GSI / 地图瓦片等外部脚本，根因通常是本地 `.env` 未配置真实凭据。

- `error: Failed to load resource: net::ERR_CONNECTION_CLOSED  ← https://a.tile.openstreetmap.org/10/163/395.png`
- `error: Failed to load resource: net::ERR_CONNECTION_CLOSED  ← https://b.tile.openstreetmap.org/10/163/396.png`
- `error: Failed to load resource: net::ERR_CONNECTION_CLOSED  ← https://b.tile.openstreetmap.org/10/164/395.png`
- `error: Failed to load resource: net::ERR_CONNECTION_CLOSED  ← https://c.tile.openstreetmap.org/10/164/396.png`
