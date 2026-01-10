// ============================================================================
// E2E Test: 首页基本功能
// ============================================================================
// 验证首页加载、核心元素渲染

import { test, expect } from "@playwright/test";

test.describe("首页 (Homepage)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("页面应正常加载", async ({ page }) => {
    // 验证页面加载成功 (标题不为空)
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("导航栏应可见", async ({ page }) => {
    // 验证导航栏存在
    const navbar = page.locator("nav, header").first();
    await expect(navbar).toBeVisible();
  });

  test("主要内容区域应可见", async ({ page }) => {
    // 验证主要内容区存在
    const mainContent = page.locator("main, [role='main'], .container").first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });
});
