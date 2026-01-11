// ============================================================================
// E2E Test: 商店页面 (Public Shop)
// ============================================================================
// 验证公开商店页面、商品列表、商品详情页、加入购物车功能
// 无需登录即可访问商品列表

import { test, expect } from "@playwright/test";
import {
  PageValidator,
  expectApiSuccess,
  VIEWPORTS,
} from "./utils/test-helpers";

test.describe("商店页面 (Public Shop)", () => {
  // ========================================================================
  // 商品列表 API
  // ========================================================================

  test("公开 API 应返回商品列表", async ({ request }) => {
    const response = await request.get("/api/backend/products");

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("商品数据结构应包含必要字段", async ({ request }) => {
    const response = await request.get("/api/backend/products");

    expect(response.ok()).toBeTruthy();
    const json = await response.json();

    if (json.data && json.data.length > 0) {
      const product = json.data[0];
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("price");
      expect(typeof product.price).toBe("number");
      expect(product).toHaveProperty("stock");
    }
  });

  // ========================================================================
  // 商品详情 API
  // ========================================================================

  test("商品详情 API 应返回正确数据", async ({ request }) => {
    // 先获取商品列表
    const listResponse = await request.get("/api/backend/products");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const productId = listJson.data[0].id;

    // 获取商品详情
    const detailResponse = await request.get(
      `/api/backend/products/${productId}`
    );
    expect(detailResponse.ok()).toBeTruthy();

    const detailJson = await detailResponse.json();
    expectApiSuccess(detailJson);
    expect(detailJson.data).toHaveProperty("id", productId);
    expect(detailJson.data).toHaveProperty("name");
    expect(detailJson.data).toHaveProperty("description");
    expect(detailJson.data).toHaveProperty("price");
  });

  test("不存在的商品应返回 404", async ({ request }) => {
    const response = await request.get("/api/backend/products/99999");
    expect(response.status()).toBe(404);
  });

  // ========================================================================
  // 商店页面 UI
  // ========================================================================

  test("商店页面应正常加载", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/shop");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    await validator.expectTitleContains("商店");

    // 截图保存
    await page.screenshot({
      path: "test-results/screenshots/shop-page.png",
      fullPage: true,
    });
  });

  test("商店页面应显示商品卡片或空状态", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 检查是否有商品链接或空状态提示
    // 商品链接格式: /shop/{id}
    const productLinks = page.locator('a[href^="/shop/"]').first();
    // 空状态文字:“暂无商品”
    const emptyState = page.locator('text="暂无商品"');

    // 等待任一个出现
    await expect(productLinks.or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test("商品卡片应可点击进入详情页", async ({ page }) => {
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 检查是否有商品
    const productLinks = page.locator('a[href^="/shop/"]');
    const count = await productLinks.count();

    if (count === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    // 获取第一个商品链接的 href
    const firstLink = productLinks.first();
    const href = await firstLink.getAttribute("href");

    // 使用 Promise.all 确保点击和导航同步
    await Promise.all([
      page.waitForURL(`**${href}`, { timeout: 10000 }),
      firstLink.click(),
    ]);

    // 验证 URL 跳转到商品详情页
    expect(page.url()).toMatch(/\/shop\/\d+/);
  });

  // ========================================================================
  // 商品详情页 UI
  // ========================================================================

  test("商品详情页应正常加载", async ({ page, request }) => {
    // 先获取一个商品 ID
    const listResponse = await request.get("/api/backend/products");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const productId = listJson.data[0].id;

    const validator = new PageValidator(page);
    await validator.goto(`/shop/${productId}`);

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 商品详情页是客户端组件，需要等待数据加载完成
    // 等待价格显示（¥ 符号），增加超时时间
    await expect(page.locator('text=/¥\\d/').first()).toBeVisible({ timeout: 15000 });

    // 截图保存
    await page.screenshot({
      path: "test-results/screenshots/product-detail-page.png",
      fullPage: true,
    });
  });

  test("商品详情页应显示加入购物车按钮", async ({ page, request }) => {
    // 获取一个商品
    const listResponse = await request.get("/api/backend/products");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const productId = listJson.data[0].id;

    await page.goto(`/shop/${productId}`);
    await page.waitForLoadState("networkidle");

    // 检查购物车按钮
    const cartButton = page.locator(
      'button:has-text("加入购物车"), button:has-text("添加到购物车")'
    );
    await expect(cartButton.first()).toBeVisible();
  });

  // ========================================================================
  // 移动端布局
  // ========================================================================

  test("商店页面移动端布局应正确", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/shop");
    await page.waitForLoadState("networkidle");

    // 验证标题可见
    await expect(page.locator("h1")).toBeVisible();

    // 截图
    await page.screenshot({
      path: "test-results/screenshots/shop-mobile.png",
      fullPage: true,
    });
  });
});
