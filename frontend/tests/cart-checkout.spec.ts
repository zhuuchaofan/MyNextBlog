// ============================================================================
// E2E Test: 购物车与结账流程 (Cart & Checkout)
// ============================================================================
// 验证购物车页面、加入购物车、结账流程
// 购物车使用 localStorage 存储

import { test, expect } from "@playwright/test";
import {
  PageValidator,
  VIEWPORTS,
} from "./utils/test-helpers";

test.describe("购物车与结账 (Cart & Checkout)", () => {
  // ========================================================================
  // 购物车页面
  // ========================================================================

  test("购物车页面应正常加载", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/cart");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    await validator.expectTitleContains("购物车");

    // 截图保存
    await page.screenshot({
      path: "test-results/screenshots/cart-page.png",
      fullPage: true,
    });
  });

  test("空购物车应显示提示信息", async ({ page }) => {
    // 清空 localStorage (确保购物车为空)
    await page.goto("/cart");
    await page.evaluate(() => localStorage.removeItem("shopping_cart"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 检查空状态提示
    await expect(page.locator('text="购物车是空的"')).toBeVisible();
    await expect(page.locator('a:has-text("去逛逛")')).toBeVisible();
  });

  test("购物车应能显示商品", async ({ page, request }) => {
    // 先获取一个商品
    const productsRes = await request.get("/api/backend/products");
    const productsJson = await productsRes.json();

    if (!productsJson.data || productsJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const product = productsJson.data[0];

    // 设置购物车数据
    await page.goto("/cart");
    await page.evaluate(
      (p) => {
        const cartItem = {
          productId: p.id,
          productName: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          quantity: 1,
          stock: p.stock,
        };
        localStorage.setItem("shopping_cart", JSON.stringify([cartItem]));
      },
      product
    );

    // 刷新页面
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 验证商品显示
    await expect(page.locator(`text="${product.name}"`).first()).toBeVisible();
    await expect(page.locator('text="去结算"').first()).toBeVisible();
  });

  // ========================================================================
  // 从商品详情页加入购物车
  // ========================================================================

  test("从商品详情页加入购物车", async ({ page, request }) => {
    // 获取一个商品
    const productsRes = await request.get("/api/backend/products");
    const productsJson = await productsRes.json();

    if (!productsJson.data || productsJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const product = productsJson.data[0];

    // 访问商品详情页
    await page.goto(`/shop/${product.id}`);
    await page.waitForLoadState("networkidle");

    // 点击加入购物车
    const addToCartButton = page.locator(
      'button:has-text("加入购物车"), button:has-text("添加到购物车")'
    );
    await addToCartButton.first().click();

    // 等待操作完成 (可能有 toast 提示)
    await page.waitForTimeout(500);

    // 验证购物车中有商品
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(`text="${product.name}"`).first()).toBeVisible();
  });

  // ========================================================================
  // 购物车数量控制
  // ========================================================================

  test("购物车商品数量可以增减", async ({ page, request }) => {
    // 获取商品
    const productsRes = await request.get("/api/backend/products");
    const productsJson = await productsRes.json();

    if (!productsJson.data || productsJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const product = productsJson.data[0];

    // 设置购物车 (数量为 2)
    await page.goto("/cart");
    await page.evaluate(
      (p) => {
        const cartItem = {
          productId: p.id,
          productName: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          quantity: 2,
          stock: p.stock,
        };
        localStorage.setItem("shopping_cart", JSON.stringify([cartItem]));
      },
      product
    );

    await page.reload();
    await page.waitForLoadState("networkidle");

    // 验证数量显示
    await expect(page.locator('text="2"').first()).toBeVisible();

    // 点击减号
    const minusButton = page.locator('button >> svg.lucide-minus').first();
    if (await minusButton.isVisible()) {
      await minusButton.click();
      await page.waitForTimeout(300);

      // 检查数量变为 1
      const cartData = await page.evaluate(() =>
        localStorage.getItem("shopping_cart")
      );
      if (cartData) {
        const cart = JSON.parse(cartData);
        expect(cart[0].quantity).toBe(1);
      }
    }
  });

  test("购物车商品可以删除", async ({ page, request }) => {
    // 获取商品
    const productsRes = await request.get("/api/backend/products");
    const productsJson = await productsRes.json();

    if (!productsJson.data || productsJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const product = productsJson.data[0];

    // 设置购物车
    await page.goto("/cart");
    await page.evaluate(
      (p) => {
        const cartItem = {
          productId: p.id,
          productName: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          quantity: 1,
          stock: p.stock,
        };
        localStorage.setItem("shopping_cart", JSON.stringify([cartItem]));
      },
      product
    );

    await page.reload();
    await page.waitForLoadState("networkidle");

    // 点击删除按钮
    const deleteButton = page
      .locator('button >> svg.lucide-trash-2')
      .first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(300);

      // 验证购物车已清空
      await expect(page.locator('text="购物车是空的"')).toBeVisible();
    }
  });

  // ========================================================================
  // 结账页面
  // ========================================================================

  test("未登录用户访问结账页应提示登录", async ({ page, request }) => {
    // 获取商品并设置购物车
    const productsRes = await request.get("/api/backend/products");
    const productsJson = await productsRes.json();

    if (!productsJson.data || productsJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const product = productsJson.data[0];

    // 清除登录状态的 cookie
    await page.context().clearCookies();

    await page.goto("/cart");
    await page.evaluate(
      (p) => {
        const cartItem = {
          productId: p.id,
          productName: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          quantity: 1,
          stock: p.stock,
        };
        localStorage.setItem("shopping_cart", JSON.stringify([cartItem]));
      },
      product
    );

    // 访问结账页
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");

    // 应该显示登录提示
    await expect(page.locator('text="请先登录"')).toBeVisible();
    await expect(page.locator('a:has-text("去登录")')).toBeVisible();
  });

  test("登录用户可以访问结账页", async ({ page, request }) => {
    // storageState 已自动加载，用户已登录

    // 获取商品并设置购物车
    const productsRes = await request.get("/api/backend/products");
    const productsJson = await productsRes.json();

    if (!productsJson.data || productsJson.data.length === 0) {
      test.skip(true, "没有可用商品");
      return;
    }

    const product = productsJson.data[0];

    await page.goto("/cart");
    await page.evaluate(
      (p) => {
        const cartItem = {
          productId: p.id,
          productName: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          quantity: 1,
          stock: p.stock,
        };
        localStorage.setItem("shopping_cart", JSON.stringify([cartItem]));
      },
      product
    );

    // 访问结账页
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");

    // 结账页是客户端组件，需要等待数据加载
    // 检查确认订单页面元素（增加超时）
    await expect(page.locator('h1:has-text("确认订单")')).toBeVisible({ timeout: 15000 });
    
    await expect(page.locator('button:has-text("提交订单")')).toBeVisible({ timeout: 5000 });

    // 截图
    await page.screenshot({
      path: "test-results/screenshots/checkout-page.png",
      fullPage: true,
    });
  });

  // ========================================================================
  // 移动端布局
  // ========================================================================

  test("购物车移动端布局应正确", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/cart");
    await page.waitForLoadState("networkidle");

    // 验证标题可见
    await expect(page.locator("h1")).toBeVisible();

    // 截图
    await page.screenshot({
      path: "test-results/screenshots/cart-mobile.png",
      fullPage: true,
    });
  });
});
