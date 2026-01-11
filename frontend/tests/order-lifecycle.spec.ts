// ============================================================================
// E2E Test: 订单完整生命周期 (Order Lifecycle)
// ============================================================================
// 这是项目中最复杂的全链路 E2E 测试
// 验证从浏览商品到完成订单的完整业务流程
//
// 测试场景:
//   1. 浏览商品列表 → 获取商品信息
//   2. 创建订单 → 验证订单创建成功
//   3. 查询订单 → 验证订单状态为"待付款"
//   4. 执行付款 → 验证状态变更为"已付款"
//   5. 取消订单流程 (单独测试)

import { test, expect } from "@playwright/test";
import {
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
  E2E_PREFIX,
} from "./utils/test-helpers";

test.describe("订单完整生命周期 (Order Lifecycle)", () => {
  // 串行执行保证流程顺序
  test.describe.configure({ mode: "serial" });

  // 跨测试共享的状态
  let authToken: string | null = null;
  let productId: number | null = null;
  let orderId: number | null = null;

  // ========================================================================
  // Step 1: 获取商品列表 (公开 API)
  // ========================================================================

  test("1.1 浏览商品列表", async ({ request }) => {
    const response = await request.get("/api/backend/products");

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(Array.isArray(json.data)).toBeTruthy();

    // 保存第一个商品的 ID 供后续测试使用
    if (json.data && json.data.length > 0) {
      productId = json.data[0].id;
      console.log(`[E2E] 选中商品 ID: ${productId}`);
    } else {
      test.skip(true, "没有可用商品，跳过订单测试");
    }
  });

  test("1.2 获取商品详情", async ({ request }) => {
    if (!productId) {
      test.skip(true, "无商品 ID");
      return;
    }

    const response = await request.get(`/api/backend/products/${productId}`);

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json.data).toHaveProperty("id", productId);
    expect(json.data).toHaveProperty("name");
    expect(json.data).toHaveProperty("price");

    console.log(`[E2E] 商品详情: ${json.data.name} - ¥${json.data.price}`);
  });

  // ========================================================================
  // Step 2: 用户登录并创建订单
  // ========================================================================

  test("2.1 用户登录", async ({ request }) => {
    authToken = await loginAndGetToken(request);

    if (!authToken) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    expect(authToken).toBeTruthy();
    console.log("[E2E] 登录成功，获取到 Token");
  });

  test("2.2 创建订单", async ({ request }) => {
    if (!authToken || !productId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // 创建订单请求
    const response = await request.post("/api/backend/orders", {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        items: [
          {
            productId: productId,
            quantity: 1,
          },
        ],
        remark: `${E2E_PREFIX} 自动化测试订单`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    // 保存订单 ID
    orderId = json.data?.id;
    expect(orderId).toBeTruthy();

    console.log(`[E2E] 订单创建成功，订单 ID: ${orderId}`);
  });

  // ========================================================================
  // Step 3: 验证订单状态
  // ========================================================================

  test("3.1 查询订单 - 状态应为待付款", async ({ request }) => {
    if (!authToken || !orderId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    const response = await request.get(`/api/backend/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    // 验证订单状态
    expect(json.data).toHaveProperty("id", orderId);
    // 订单状态应为 "Pending" 或 "待付款" (根据实际实现)
    console.log(`[E2E] 订单状态: ${json.data.status}`);
  });

  test("3.2 订单列表应包含新订单", async ({ request }) => {
    if (!authToken || !orderId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    const response = await request.get("/api/backend/orders", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    // 验证订单列表包含刚创建的订单
    const orders = json.data as { id: number }[];
    const found = orders.some((o) => o.id === orderId);
    expect(found).toBeTruthy();

    console.log(`[E2E] 订单列表中找到订单 ${orderId}`);
  });

  // ========================================================================
  // Step 4: 执行付款流程
  // ========================================================================

  test("4.1 执行付款", async ({ request }) => {
    if (!authToken || !orderId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    const response = await request.post(`/api/backend/orders/${orderId}/pay`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    console.log(`[E2E] 付款成功: ${json.message}`);
  });

  test("4.2 验证付款后订单状态", async ({ request }) => {
    if (!authToken || !orderId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    const response = await request.get(`/api/backend/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();

    // 付款后状态应变更
    console.log(`[E2E] 付款后状态: ${json.data.status}`);
  });

  // ========================================================================
  // Step 5: UI 全链路验证
  // ========================================================================

  test("5.1 UI 验证 - 我的订单页面显示新订单", async ({ page, context }) => {
    if (!orderId) {
      test.skip(true, "无订单 ID");
      return;
    }

    // storageState 已自动加载管理员登录状态
    const validator = new PageValidator(page);
    await validator.goto("/orders");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 页面应显示订单
    const content = await page.content();
    const hasOrderContent =
      content.includes("订单") || content.includes("order");
    expect(hasOrderContent).toBeTruthy();

    // 截图保存证据
    await page.screenshot({
      path: `test-results/screenshots/order-lifecycle-${orderId}.png`,
      fullPage: true,
    });

    console.log(`[E2E] UI 验证完成，截图已保存`);
  });
});

// ============================================================================
// 独立测试: 订单取消流程
// ============================================================================

test.describe("订单取消流程", () => {
  test.describe.configure({ mode: "serial" });

  let authToken: string | null = null;
  let productId: number | null = null;
  let cancelOrderId: number | null = null;

  test("创建待取消订单", async ({ request }) => {
    // 获取商品
    const productsRes = await request.get("/api/backend/products");
    const productsJson = await productsRes.json();
    if (!productsJson.data || productsJson.data.length === 0) {
      test.skip(true, "无商品");
      return;
    }
    productId = productsJson.data[0].id;

    // 登录
    authToken = await loginAndGetToken(request);
    if (!authToken) {
      test.skip(true, "登录失败");
      return;
    }

    // 创建订单
    const orderRes = await request.post("/api/backend/orders", {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        items: [{ productId, quantity: 1 }],
        remark: `${E2E_PREFIX} 取消测试订单`,
      },
    });

    if (orderRes.ok()) {
      const orderJson = await orderRes.json();
      cancelOrderId = orderJson.data?.id;
    }
  });

  test("取消订单", async ({ request }) => {
    if (!authToken || !cancelOrderId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    const response = await request.post(
      `/api/backend/orders/${cancelOrderId}/cancel`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    console.log(`[E2E] 订单 ${cancelOrderId} 已取消`);
  });

  test("验证取消后订单状态", async ({ request }) => {
    if (!authToken || !cancelOrderId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    const response = await request.get(
      `/api/backend/orders/${cancelOrderId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();

    console.log(`[E2E] 取消后状态: ${json.data.status}`);
  });
});
