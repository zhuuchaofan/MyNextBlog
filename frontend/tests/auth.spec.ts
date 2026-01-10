// ============================================================================
// E2E Test: 认证功能
// ============================================================================
// 验证登录、注册 API 的基本结构

import { test, expect } from "@playwright/test";

test.describe("认证功能 (Authentication)", () => {
  test("登录 API 应拒绝无效凭据", async ({ request }) => {
    const response = await request.post("/api/backend/auth/login", {
      data: {
        username: "invalid_user",
        password: "invalid_password",
      },
    });

    // 应返回 401 或 400
    expect(response.ok()).toBeFalsy();
    expect([400, 401]).toContain(response.status());

    const json = await response.json();
    // 响应应包含 success: false 和错误信息
    expect(json).toHaveProperty("success", false);
    expect(json).toHaveProperty("message");
  });

  test("获取当前用户应返回 401 (未登录)", async ({ request }) => {
    const response = await request.get("/api/backend/account/me");

    // 未登录时应返回 401
    expect(response.status()).toBe(401);
  });

  test("登录页面应可访问", async ({ page }) => {
    await page.goto("/login");

    // 页面应包含登录表单元素
    const usernameInput = page.locator(
      'input[name="username"], input[type="text"], input[placeholder*="用户名"]'
    ).first();
    const passwordInput = page.locator(
      'input[name="password"], input[type="password"]'
    ).first();
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("登录")'
    ).first();

    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });
});
