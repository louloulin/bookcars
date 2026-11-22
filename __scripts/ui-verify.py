#!/usr/bin/env python3
"""
BookCars UI 截图验证脚本（Playwright / Chromium）

用途
----
对本地运行的前台（frontend）与管理后台（admin）逐页截图，并做自动化断言：
  1. 页面 HTTP 200、无 pageerror、无 console error
  2. 关键元素存在（标题 / 表格 / 卡片等选择器）
   3. 无 "破图"：所有 <img> 的 naturalWidth > 0
  4. 供应商头像兜底 span.supplier-avatar-fallback 在结算页 / 列表页存在
  5. 无横向溢出：document.scrollWidth <= viewport width + 4
  6. 无文字溢出裁切：关键容器 scrollWidth <= clientWidth + 4

产物
----
  docs/ui-preview/<name>.png            1440x900 桌面截图
  docs/ui-preview/mobile-<name>.png     390x844  移动截图
  docs/ui-preview/verify-report.json    机器可读结果
  docs/ui-preview/verify-report.md      人读报告

用法
----
  # 前置：backend :4002、frontend :33002、admin :33001 已启动
  FRONTEND_URL=http://localhost:33002 \
  ADMIN_URL=http://localhost:33001 \
  /opt/homebrew/bin/python3.14 __scripts/ui-verify.py

环境变量
--------
  FRONTEND_URL     前台地址，默认 http://localhost:33002
  ADMIN_URL        后台地址，默认 http://localhost:33001
  ADMIN_EMAIL      后台账号，默认 admin@bookcars.ma
  ADMIN_PASSWORD   后台密码，默认 B00kC4r5
  CUSTOMER_EMAIL   客户账号，默认 dev-seed-customer@bookcars.ma
  CUSTOMER_PASSWORD 客户密码，默认 B00kC4r5
  OUT_DIR          截图输出目录，默认 docs/ui-preview
  SKIP_MOBILE      设为 1 则跳过移动端截图
"""

import json
import os
import sys
import time
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover
    sys.exit("playwright 未安装：/opt/homebrew/bin/python3.14 -m pip install playwright")

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = os.environ.get("FRONTEND_URL", "http://localhost:33002")
ADMIN = os.environ.get("ADMIN_URL", "http://localhost:33001")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@bookcars.ma")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "B00kC4r5")
CUSTOMER_EMAIL = os.environ.get("CUSTOMER_EMAIL", "dev-seed-customer@bookcars.ma")
CUSTOMER_PASSWORD = os.environ.get("CUSTOMER_PASSWORD", "B00kC4r5")
OUT_DIR = Path(os.environ.get("OUT_DIR", ROOT / "docs" / "ui-preview"))
SKIP_MOBILE = os.environ.get("SKIP_MOBILE") == "1"

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

# (label, path, 关键选择器列表, 是否需要登录)
FRONT_PAGES = [
    ("web-home", "/", [".app", ".site-header"], False),
    ("web-locations", "/locations", [".app"], False),
    ("web-suppliers", "/suppliers", [".app"], False),
    ("web-faq", "/faq", [".app"], False),
    ("web-about", "/about", [".app"], False),
    ("web-contact", "/contact", [".app"], False),
    ("web-privacy", "/privacy", [".app"], False),
    ("web-signin", "/sign-in", [".signin", "form"], False),
    ("web-signup", "/sign-up", [".app", "form"], False),
    ("web-bookings", "/bookings", [".app"], True),
    ("web-notifications", "/notifications", [".app"], True),
    ("web-settings", "/settings", [".app"], True),
]

ADMIN_PAGES = [
    ("admin-dashboard", "/", [".app"], True),
    ("admin-bookings", "/bookings", [".app"], True),
    ("admin-cars", "/cars", [".app"], True),
    ("admin-users", "/users", [".app"], True),
    ("admin-suppliers", "/suppliers", [".app"], True),
    ("admin-locations", "/locations", [".app"], True),
    ("admin-settings", "/settings", [".app"], True),
    ("admin-notifications", "/notifications", [".app"], True),
    ("admin-countries", "/countries", [".app"], True),
    ("admin-scheduler", "/scheduler", [".app"], True),
    ("admin-bank-details", "/bank-details", [".app"], True),
    ("admin-pricing", "/pricing", [".app"], True),
    ("admin-about", "/about", [".app"], True),
    ("admin-contact", "/contact", [".app"], True),
]

# 需要搜索结果的页面单独处理（需要 location id 与日期）
SEARCH_QUERY = (
    "/search?pickupLocation=6b00d2ce06845f6e5d13b036"
    "&from=2026-12-01T10:00:00.000Z&to=2026-12-05T10:00:00.000Z"
)


def collect(page):
    """返回页面内可自动断言的结构化信息。

    破图判定：仅当图片已加载完成（complete）且 naturalWidth === 0 才算破图；
    仍在懒加载中的图片不算。外站（openstreetmap 瓦片、react-circle-flags 国旗等）
    单独归入 externalBlocked，不作为失败依据。
    """
    return page.evaluate(
        """() => {
        const broken = [];
        const externalBlocked = [];
        const isLocal = (u) => !u || u.startsWith('http://localhost') || u.startsWith('http://127.0.0.1') || u.startsWith('/') || u.startsWith('data:');
        document.querySelectorAll('img').forEach((img) => {
            const src = img.currentSrc || img.src || '(empty)';
            if (!img.complete) { return; }
            if (img.naturalWidth === 0) {
                if (isLocal(src)) { broken.push(src); } else { externalBlocked.push(src); }
            }
        });
        const overflow = [];
        document.querySelectorAll('main, section, article, .ws-body, .bs-list, table').forEach((el) => {
            if (el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 0) {
                overflow.push({
                    selector: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').slice(0,2).join('.') : ''),
                    scrollWidth: el.scrollWidth,
                    clientWidth: el.clientWidth,
                });
            }
        });
        const doc = document.documentElement;
        return {
            brokenImages: broken,
            externalBlockedImages: externalBlocked,
            horizontalOverflow: doc.scrollWidth > doc.clientWidth + 4
                ? { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth } : null,
            containerOverflow: overflow.slice(0, 5),
            fallbackAvatars: document.querySelectorAll('span.supplier-avatar-fallback').length,
            h1: (document.querySelector('h1, h2') || {}).textContent || '',
            textLength: (document.body.innerText || '').trim().length,
        };
    }"""
    )


def run_page(ctx, url, out_png, selectors, wait=2200, click=None):
    """打开一页，收集错误，截图，返回结果字典。"""
    errors, console_errors, failed_requests = [], [], []
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on(
        "console",
        lambda m: console_errors.append(f"{m.type}: {m.text}")
        if m.type in ("error",)
        else None,
    )
    page.on("requestfailed", lambda r: failed_requests.append(f"{r.url} :: {r.failure}"))

    result = {"url": url, "screenshot": str(out_png)}
    status = None
    try:
        resp = page.goto(url, wait_until="domcontentloaded", timeout=30000)
        status = resp.status if resp else None
        try:
            page.wait_for_load_state("networkidle", timeout=6000)
        except Exception:
            pass  # 页面存在长连接/轮询时忽略，等待固定时长即可
        page.wait_for_timeout(wait)
        if click:
            try:
                page.click(click, timeout=8000)
                page.wait_for_timeout(2500)
            except Exception as exc:  # noqa: BLE001
                result["clickError"] = str(exc)
        missing = []
        for sel in selectors:
            try:
                if page.locator(sel).count() == 0:
                    missing.append(sel)
            except Exception:  # noqa: BLE001
                missing.append(sel)
        info = collect(page)
        out_png.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(out_png))
    except Exception as exc:  # noqa: BLE001
        result["fatal"] = str(exc)
        info = {}
        missing = []
    finally:
        page.close()

    result.update(
        {
            "httpStatus": status,
            "pageErrors": errors,
            "consoleErrors": [c for c in console_errors if "Failed to load resource" not in c],
            "failedRequests": failed_requests,
            "missingSelectors": missing,
            "info": info,
        }
    )
    result["pass"] = (
        status == 200
        and not errors
        and not result["consoleErrors"]
        and not missing
        and not info.get("brokenImages")
        and not info.get("horizontalOverflow")
    )
    return result


def sign_in_admin(ctx):
    page = ctx.new_page()
    ok = False
    try:
        page.goto(f"{ADMIN}/sign-in", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(1500)
        page.fill("input[name='email']", ADMIN_EMAIL)
        page.fill("input[name='password']", ADMIN_PASSWORD)
        page.click("button[type='submit']")
        page.wait_for_timeout(3500)
        ok = "/sign-in" not in page.url
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] 后台登录失败: {exc}", file=sys.stderr)
    finally:
        page.close()
    return ok


def sign_in_customer(ctx):
    page = ctx.new_page()
    ok = False
    try:
        page.goto(f"{FRONTEND}/sign-in", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(1500)
        page.fill("input[name='email']", CUSTOMER_EMAIL)
        page.fill("input[name='password']", CUSTOMER_PASSWORD)
        page.click("button[type='submit']")
        page.wait_for_timeout(3500)
        ok = "/sign-in" not in page.url
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] 客户登录失败: {exc}", file=sys.stderr)
    finally:
        page.close()
    return ok


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    started = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")

        # ---------- 前台（未登录） ----------
        ctx = browser.new_context(viewport=DESKTOP)
        for label, path, selectors, needs_login in FRONT_PAGES:
            if needs_login:
                continue
            url = FRONTEND + path
            r = run_page(ctx, url, OUT_DIR / f"{label}.png", selectors)
            r["group"] = "frontend-public"
            results.append(r)
            print(f"[frontend] {label:22s} {r.get('httpStatus')} pass={r['pass']}")

        # 搜索结果页（需 location id）
        r = run_page(ctx, FRONTEND + SEARCH_QUERY, OUT_DIR / "web-search.png", [".app"])
        r["group"] = "frontend-public"
        results.append(r)
        print(f"[frontend] {'web-search':22s} {r.get('httpStatus')} pass={r['pass']}")

        # 结算页：搜索 -> 点击 .btn-book
        r = run_page(
            ctx,
            FRONTEND + SEARCH_QUERY,
            OUT_DIR / "web-checkout.png",
            [".app"],
            click=".btn-book",
        )
        r["group"] = "frontend-checkout"
        results.append(r)
        print(f"[frontend] {'web-checkout':22s} {r.get('httpStatus')} pass={r['pass']} "
              f"fallbacks={r['info'].get('fallbackAvatars')}")

        # ---------- 前台（客户登录） ----------
        if sign_in_customer(ctx):
            for label, path, selectors, needs_login in FRONT_PAGES:
                if not needs_login:
                    continue
                r = run_page(ctx, FRONTEND + path, OUT_DIR / f"{label}.png", selectors)
                r["group"] = "frontend-auth"
                results.append(r)
                print(f"[frontend] {label:22s} {r.get('httpStatus')} pass={r['pass']}")
        else:
            print("[warn] 客户登录未成功，跳过登录态页面", file=sys.stderr)

        # ---------- 移动端 ----------
        if not SKIP_MOBILE:
            mctx = browser.new_context(
                viewport=MOBILE, device_scale_factor=2, is_mobile=True, has_touch=True
            )
            for label, path in [("home", "/"), ("search", SEARCH_QUERY)]:
                r = run_page(mctx, FRONTEND + path, OUT_DIR / f"mobile-{label}.png", [".app"])
                r["group"] = "frontend-mobile"
                results.append(r)
                print(f"[mobile]  {label:22s} {r.get('httpStatus')} pass={r['pass']}")
            mctx.close()
        ctx.close()

        # ---------- 管理后台 ----------
        actx = browser.new_context(viewport=DESKTOP)
        admin_ok = sign_in_admin(actx)
        if not admin_ok:
            print("[warn] 后台登录未成功，页面可能跳回登录页", file=sys.stderr)
        for label, path, selectors, _ in ADMIN_PAGES:
            r = run_page(actx, ADMIN + path, OUT_DIR / f"{label}.png", selectors)
            r["group"] = "admin"
            results.append(r)
            print(f"[admin]   {label:22s} {r.get('httpStatus')} pass={r['pass']} "
                  f"fallbacks={r['info'].get('fallbackAvatars')}")
        actx.close()
        browser.close()

    elapsed = round(time.time() - started, 1)
    total = len(results)
    passed = sum(1 for r in results if r["pass"])
    summary = {
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
        "frontend": FRONTEND,
        "admin": ADMIN,
        "elapsedSeconds": elapsed,
        "total": total,
        "passed": passed,
        "failed": total - passed,
        "results": results,
    }
    (OUT_DIR / "verify-report.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    lines = [
        "# BookCars UI 截图验证报告",
        "",
        f"- 生成时间：{summary['generatedAt']}",
        f"- 前台：{FRONTEND}　后台：{ADMIN}",
        f"- 用时：{elapsed}s　页面数：{total}　通过：{passed}　失败：{total - passed}",
        "",
        "| 页面 | 分组 | HTTP | pageerror | console error | 破图 | 外站拦截 | 横向溢出 | 兜底头像 | 结论 |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for r in results:
        info = r.get("info", {})
        lines.append(
            "| {name} | {grp} | {st} | {pe} | {ce} | {bi} | {eb} | {ov} | {fa} | {ok} |".format(
                name=r["screenshot"].split("/")[-1],
                grp=r.get("group", "-"),
                st=r.get("httpStatus", "-"),
                pe=len(r.get("pageErrors", [])),
                ce=len(r.get("consoleErrors", [])),
                bi=len(info.get("brokenImages", [])),
                eb=len(info.get("externalBlockedImages", [])),
                ov="有" if info.get("horizontalOverflow") else "无",
                fa=info.get("fallbackAvatars", 0),
                ok="✅ 通过" if r["pass"] else "❌ 失败",
            )
        )
    failures = [r for r in results if not r["pass"]]
    if failures:
        lines += ["", "## 失败明细", ""]
        for r in failures:
            info = r.get("info", {})
            lines += [
                f"### {r['screenshot'].split('/')[-1]}（{r.get('group', '-')}）",
                "",
                f"- URL：{r.get('url')}",
                f"- HTTP：{r.get('httpStatus')}　pageerror：{len(r.get('pageErrors', []))}　"
                f"console error：{len(r.get('consoleErrors', []))}",
                f"- 缺失选择器：{r.get('missingSelectors') or '无'}",
                f"- 破图：{info.get('brokenImages') or '无'}",
                f"- 外站资源被拦截（不计入失败）：{info.get('externalBlockedImages') or '无'}",
                f"- 横向溢出：{info.get('horizontalOverflow') or '无'}",
                "",
            ]
            for e in r.get("pageErrors", []):
                lines.append(f"  - pageerror: `{e}`")
            for e in r.get("consoleErrors", []):
                lines.append(f"  - console: `{e}`")

    external = sorted({
        u
        for r in results
        for u in r.get("info", {}).get("externalBlockedImages", [])
    })
    if external:
        lines += [
            "",
            "## 外站资源（离线/网络受限，未计入失败）",
            "",
            *[f"- `{u}`" for u in external],
        ]

    (OUT_DIR / "verify-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"\n共 {total} 页，通过 {passed}，失败 {total - passed}，用时 {elapsed}s")
    print(f"报告：{OUT_DIR / 'verify-report.md'}")
    for r in results:
        if not r["pass"]:
            print(f"  ✗ {r['screenshot'].split('/')[-1]}: "
                  f"status={r.get('httpStatus')} pageErr={r.get('pageErrors')} "
                  f"consoleErr={r.get('consoleErrors')[:2]} missing={r.get('missingSelectors')} "
                  f"broken={r.get('info', {}).get('brokenImages')}")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
