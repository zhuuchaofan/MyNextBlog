// ============================================================================
// E2E Test: 用户在线状态 (Presence Widget)
// ============================================================================
// 验证数字分身功能的前后端集成

import { test, expect } from "@playwright/test";

test.describe("用户在线状态 (Presence)", () => {
  test("API 应返回有效的状态结构", async ({ request }) => {
    // 直接测试 API 响应
    const response = await request.get("/api/backend/presence");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();

    // 验证响应结构
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(json.data).toHaveProperty("status");
    expect(json.data).toHaveProperty("icon");
    expect(json.data).toHaveProperty("message");
    expect(json.data).toHaveProperty("timestamp");

    // 验证 status 存在且是字符串
    expect(typeof json.data.status).toBe("string");
    expect(json.data.status.length).toBeGreaterThan(0);
  });

  test("导航栏应显示状态小组件", async ({ page }) => {
    await page.goto("/");

    // 等待状态小组件加载（桌面端或移动端）
    // 使用 CSS 选择器匹配可能的容器
    const presenceWidget = page.locator(
      '[class*="rounded-full"]:has([class*="w-5 h-5"])'
    );

    // 状态小组件应该在 10 秒内可见（考虑 API 延迟）
    await expect(presenceWidget.first()).toBeVisible({ timeout: 10000 });
  });
});
