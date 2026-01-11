// ============================================================================
// E2E Test: 订单管理 (Orders)
// ============================================================================
// 验证用户订单流程：创建、查询、付款、取消
// 策略：先记录失败，后分析原因

import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
} from "./utils/test-helpers";

test.describe("订单管理 (Orders)", () => {
  // 串行执行
  test.describe.configure({ mode: "serial" });

  // ========================================================================
  // 权限验证
  // ========================================================================

  test("未登录用户无法创建订单", async ({ request }) => {
    const response = await request.post("/api/backend/orders", {
      data: { items: [{ productId: 1, quantity: 1 }] },
    });
    expect(response.status()).toBe(401);
  });

  test("未登录用户无法查看订单列表", async ({ request }) => {
    const response = await request.get("/api/backend/orders");
    expect(response.status()).toBe(401);
  });

  test("未登录用户无法查看订单详情", async ({ request }) => {
    const response = await request.get("/api/backend/orders/1");
    expect(response.status()).toBe(401);
  });

  // ========================================================================
  // 已登录用户订单 API
  // ========================================================================

  test("登录用户应能获取订单列表", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.get("/api/backend/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("获取不存在的订单应返回 404", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.get("/api/backend/orders/999999", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(404);
  });

  // ========================================================================
  // 订单操作验证 (仅结构验证，不实际创建)
  // ========================================================================

  test("创建订单缺少必要字段应返回 400", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 空请求体
    const response = await request.post("/api/backend/orders", {
      headers: { Authorization: `Bearer ${token}` },
      data: {},
    });

    expect(response.ok()).toBeFalsy();
  });

  // ========================================================================
  // UI 测试: 订单页面
  // ========================================================================

  test("我的订单页面应正常加载", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/orders");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    await page.screenshot({
      path: "test-results/screenshots/my-orders-page.png",
      fullPage: true,
    });
  });

  test("管理员订单管理页面应正常加载", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/admin/orders");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    await validator.expectTitleContains("订单");

    await page.screenshot({
      path: "test-results/screenshots/admin-orders-page.png",
      fullPage: true,
    });
  });

  // ========================================================================
  // 商品页面 UI
  // ========================================================================

  test("商品列表页应正常加载", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/shop");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    await page.screenshot({
      path: "test-results/screenshots/shop-page.png",
      fullPage: true,
    });
  });

  test("购物车页面应正常加载", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/cart");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    await page.screenshot({
      path: "test-results/screenshots/cart-page.png",
      fullPage: true,
    });
  });
});
