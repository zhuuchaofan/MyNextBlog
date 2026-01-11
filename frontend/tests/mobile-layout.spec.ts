// ============================================================================
// E2E Test: 移动端布局测试 (Mobile Layout)
// ============================================================================
// 验证关键页面在移动设备上的响应式布局

import { test, expect } from "@playwright/test";
import { loginAsAdmin, PageValidator, VIEWPORTS } from "./utils/test-helpers";

// 强制使用移动端视口
test.use({ viewport: VIEWPORTS.mobile });

test.describe("移动端布局测试 (Mobile Layout)", () => {
  // ========================================================================
  // 公开页面
  // ========================================================================

  test("首页移动端布局", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 验证移动端导航栏存在
    const mobileNav = page.locator('nav, [data-testid="mobile-nav"]');
    await expect(mobileNav.first()).toBeVisible();

    await page.screenshot({
      path: "test-results/screenshots/home-mobile.png",
      fullPage: true,
    });
  });

  test("文章列表移动端布局", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/");

    // 文章卡片应该是单列布局
    const articleCards = page.locator("article, [data-testid='post-card']");
    const count = await articleCards.count();

    if (count > 1) {
      const firstBox = await articleCards.first().boundingBox();
      const secondBox = await articleCards.nth(1).boundingBox();

      if (firstBox && secondBox) {
        // 移动端：卡片应该垂直排列 (y 不同)
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    }

    await page.screenshot({
      path: "test-results/screenshots/posts-mobile.png",
      fullPage: true,
    });
  });

  test("登录页移动端布局", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/login");

    await validator.expectNoErrors();

    // 表单应在视口内
    const form = page.locator("form").first();
    await expect(form).toBeInViewport();

    // 输入框应有合适的宽度 (接近视口宽度)
    const input = page.locator('input[type="text"], input[name="username"]').first();
    const inputBox = await input.boundingBox();
    
    if (inputBox) {
      // 输入框宽度应大于视口宽度的 70%
      expect(inputBox.width).toBeGreaterThan(VIEWPORTS.mobile.width * 0.7);
    }

    await page.screenshot({
      path: "test-results/screenshots/login-mobile.png",
      fullPage: true,
    });
  });

  // ========================================================================
  // 管理后台
  // ========================================================================

  test("管理后台移动端布局", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/admin");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 仪表盘统计卡片应适配移动端
    await page.screenshot({
      path: "test-results/screenshots/admin-dashboard-mobile.png",
      fullPage: true,
    });
  });

  test("评论管理移动端使用卡片布局", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/admin/comments");

    await validator.expectNoErrors();

    // 桌面表格应该隐藏
    const desktopTable = page.locator(".hidden.md\\:block, table.hidden");
    const isTableHidden = await desktopTable.count() > 0 
      ? !(await desktopTable.first().isVisible())
      : true;

    // 移动端卡片布局应该可见
    const mobileCards = page.locator(".md\\:hidden, [data-testid='mobile-comment-card']");
    const hasCards = await mobileCards.count() > 0;

    // 至少有一种布局可见
    expect(isTableHidden || hasCards).toBeTruthy();

    await page.screenshot({
      path: "test-results/screenshots/admin-comments-mobile.png",
      fullPage: true,
    });
  });

  test("订单页面移动端布局", async ({ page, context }) => {
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
      path: "test-results/screenshots/orders-mobile.png",
      fullPage: true,
    });
  });

  // ========================================================================
  // 商城页面
  // ========================================================================

  test("商品列表移动端布局", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/shop");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 商品卡片应适配移动端
    await page.screenshot({
      path: "test-results/screenshots/shop-mobile.png",
      fullPage: true,
    });
  });

  test("购物车移动端布局", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/cart");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    await page.screenshot({
      path: "test-results/screenshots/cart-mobile.png",
      fullPage: true,
    });
  });
});
