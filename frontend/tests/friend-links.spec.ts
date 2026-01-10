// ============================================================================
// E2E Test: 友链功能
// ============================================================================
// 验证友链页面和 API

import { test, expect } from "@playwright/test";

test.describe("友链功能 (Friend Links)", () => {
  test("友链 API 应返回正确结构", async ({ request }) => {
    const response = await request.get("/api/backend/friend-links");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();

    // 验证友链结构
    if (json.data.length > 0) {
      expect(json.data[0]).toHaveProperty("id");
      expect(json.data[0]).toHaveProperty("name");
      expect(json.data[0]).toHaveProperty("url");
    }
  });

  test("友链页面应可访问", async ({ page }) => {
    await page.goto("/friends");

    // 页面应加载成功
    expect(page.url()).toContain("/friends");

    // 主内容区应可见
    const mainContent = page.locator("main, .container").first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });
});
