// ============================================================================
// E2E Test: 关于页面
// ============================================================================
// 验证关于页面加载

import { test, expect } from "@playwright/test";

test.describe("关于页面 (About)", () => {
  test("关于页面应可访问", async ({ page }) => {
    await page.goto("/about");

    // 页面应加载成功
    expect(page.url()).toContain("/about");

    // 主内容区应可见
    const mainContent = page.locator("main, .container, article").first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });

  test("关于页面 API 应返回数据", async ({ request }) => {
    const response = await request.get("/api/backend/about/initial-data");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("success", true);
  });
});
