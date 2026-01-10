// ============================================================================
// E2E Test: 碎碎念功能 (Memos)
// ============================================================================
// 验证碎碎念 API 和页面

import { test, expect } from "@playwright/test";

test.describe("碎碎念功能 (Memos)", () => {
  test("碎碎念 API 应返回正确结构", async ({ request }) => {
    const response = await request.get("/api/backend/memos?limit=10");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();

    // 验证碎碎念结构
    if (json.data.length > 0) {
      expect(json.data[0]).toHaveProperty("id");
      expect(json.data[0]).toHaveProperty("content");
    }
  });

  test("碎碎念页面应可访问", async ({ page }) => {
    await page.goto("/memos");

    // 页面应加载成功
    expect(page.url()).toContain("/memos");

    // 主内容区应可见
    const mainContent = page.locator("main, .container").first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });
});
