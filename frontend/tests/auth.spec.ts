// ============================================================================
// E2E Test: 认证功能
// ============================================================================
// 验证登录、注册、登出等完整认证流程
//
// **注意**: 登录 API 有频率限制 (每分钟 5 次)，测试需要串行执行

import { test, expect } from "@playwright/test";

// 串行执行登录相关测试，避免触发频率限制
test.describe.configure({ mode: "serial" });

test.describe("认证功能 (Authentication)", () => {
  // ========================================================================
  // API 层测试 - 无需认证
  // ========================================================================
  
  test("获取当前用户应返回 401 (未登录)", async ({ request }) => {
    const response = await request.get("/api/backend/account/me");
    expect(response.status()).toBe(401);
  });

  test("管理员 API 应拒绝未认证访问", async ({ request }) => {
    const response = await request.get("/api/backend/admin/stats/dashboard");
    expect(response.status()).toBe(401);
  });

  test("管理员文章 API 应拒绝未认证访问", async ({ request }) => {
    const response = await request.get("/api/backend/posts/admin");
    expect(response.status()).toBe(401);
  });

  test("登录 API 应拒绝空用户名", async ({ request }) => {
    const response = await request.post("/api/backend/auth/login", {
      data: { username: "", password: "somepassword" },
    });
    expect(response.ok()).toBeFalsy();
  });

  test("登录 API 应拒绝空密码", async ({ request }) => {
    const response = await request.post("/api/backend/auth/login", {
      data: { username: "someuser", password: "" },
    });
    expect(response.ok()).toBeFalsy();
  });

  // ========================================================================
  // 完整登录流程测试 (合并为一个测试，减少登录次数)
  // ========================================================================

  test("完整登录流程: 登录 -> 访问受保护 API -> 访问管理员 API", async ({ request }) => {
    // 1. 登录
    const loginResponse = await request.post("/api/backend/auth/login", {
      data: {
        username: "chaofan",
        password: "chaofan0920",
      },
    });

    // 如果触发了频率限制，跳过此测试
    if (loginResponse.status() === 429) {
      test.skip(true, "登录频率限制触发，跳过此测试");
      return;
    }

    expect(loginResponse.ok()).toBeTruthy();

    const loginJson = await loginResponse.json();
    expect(loginJson).toHaveProperty("token");
    expect(loginJson).toHaveProperty("refreshToken");
    expect(loginJson).toHaveProperty("user");
    expect(loginJson.user).toHaveProperty("username", "chaofan");
    expect(loginJson.user).toHaveProperty("role", "Admin");

    const token = loginJson.token;

    // 2. 使用 Token 访问受保护的 API
    const meResponse = await request.get("/api/backend/account/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(meResponse.ok()).toBeTruthy();
    const meJson = await meResponse.json();
    expect(meJson).toHaveProperty("success", true);
    expect(meJson.data).toHaveProperty("username", "chaofan");

    // 3. 访问管理员专用 API
    const adminResponse = await request.get("/api/backend/posts/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(adminResponse.ok()).toBeTruthy();
    const adminJson = await adminResponse.json();
    expect(adminJson).toHaveProperty("success", true);
    expect(adminJson).toHaveProperty("data");
  });

  // ========================================================================
  // 登录失败测试
  // ========================================================================

  test("登录 API 应拒绝无效凭据", async ({ request }) => {
    const response = await request.post("/api/backend/auth/login", {
      data: {
        username: "invalid_user",
        password: "invalid_password",
      },
    });

    expect(response.ok()).toBeFalsy();
    // 可能是 401 或 429 (频率限制)
    expect([400, 401, 429]).toContain(response.status());
  });

  // ========================================================================
  // 登录页面 UI 测试
  // ========================================================================

  test("登录页面应可访问并显示表单", async ({ page }) => {
    await page.goto("/login");

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

    // 检查注册链接
    const registerLink = page.locator('a[href*="register"], a:has-text("注册")').first();
    await expect(registerLink).toBeVisible();
  });

  // ========================================================================
  // 注册页面 UI 测试
  // ========================================================================

  test("注册页面应可访问", async ({ page }) => {
    await page.goto("/register");

    const usernameInput = page.locator(
      'input[name="username"], input[placeholder*="用户名"]'
    ).first();
    const passwordInput = page.locator(
      'input[name="password"], input[type="password"]'
    ).first();
    const emailInput = page.locator(
      'input[name="email"], input[type="email"], input[placeholder*="邮箱"]'
    ).first();

    await expect(usernameInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
    await expect(emailInput).toBeVisible();
  });

  // ========================================================================
  // 忘记密码测试
  // ========================================================================

  test("忘记密码 API 应返回成功", async ({ request }) => {
    const response = await request.post("/api/backend/auth/forgot-password", {
      data: { email: "test@example.com" },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("message");
  });

  // ========================================================================
  // 登录持久化测试 (关键回归测试)
  // ========================================================================

  test("登录后刷新页面应保持用户身份", async ({ page, context }) => {
    // 1. 清除所有 cookies 确保干净状态
    await context.clearCookies();

    // 2. 访问登录页面
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // 3. 填写登录表单
    const usernameInput = page.locator('input[name="username"], input#username').first();
    const passwordInput = page.locator('input[name="password"], input#password').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await usernameInput.fill("chaofan");
    await passwordInput.fill("chaofan0920");

    // 4. 提交登录
    await submitButton.click();

    // 5. 等待登录成功并跳转
    await page.waitForURL(/\/(admin|$)/, { timeout: 10000 });

    // 6. 验证登录成功 - 调用 /api/auth/me 检查用户
    const cookies = await context.cookies();
    const tokenCookie = cookies.find(c => c.name === 'token');
    expect(tokenCookie).toBeDefined();

    // 7. 刷新页面
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 8. 再次验证用户身份 - 通过 /api/auth/me 检查
    const response = await page.request.get("/api/auth/me");
    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("user");
    expect(json.user).toHaveProperty("username", "chaofan");
    expect(json.user).toHaveProperty("role", "Admin");
  });
});
