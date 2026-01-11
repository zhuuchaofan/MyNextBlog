// ============================================================================
// E2E Test: 管理员设置 (Admin Settings)
// ============================================================================
// 验证管理员设置页面的各个子模块：站点内容、数字分身、邮件模板、纪念日
// 使用 storageState 复用登录状态

import { test, expect } from "@playwright/test";
import {
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
  VIEWPORTS,
} from "./utils/test-helpers";

test.describe("管理员设置 (Admin Settings)", () => {
  // 串行执行，避免并发冲突
  test.describe.configure({ mode: "serial" });

  // ========================================================================
  // 站点内容管理 (Site Content)
  // ========================================================================

  test.describe("站点内容管理", () => {
    test("站点内容 API 应返回数据", async ({ request }) => {
      const token = await loginAndGetToken(request);
      if (!token) {
        test.skip(true, "登录频率限制触发");
        return;
      }

      // 获取所有站点内容
      const response = await request.get("/api/backend/site-content", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expectApiSuccess(json);
      expect(json.data).toBeDefined();
    });

    test("站点内容页面应正常加载", async ({ page }) => {
      const validator = new PageValidator(page);
      await validator.goto("/admin/settings/content");

      // 验证 URL
      expect(page.url()).toContain("/admin/settings/content");

      await validator.expectNoErrors();
      await validator.expectNotErrorPage();

      // 等待页面加载完成
      await page.waitForLoadState("domcontentloaded");

      // 检查页面标题
      await expect(page.locator('h1:has-text("内容配置")')).toBeVisible({
        timeout: 10000,
      });

      // 截图
      await page.screenshot({
        path: "test-results/screenshots/admin-settings-content.png",
        fullPage: true,
      });
    });

    test("编辑站点内容应打开编辑器", async ({ page }) => {
      await page.goto("/admin/settings/content");
      await page.waitForLoadState("networkidle");

      // 查找编辑按钮
      const editButton = page.locator('button:has-text("编辑")').first();
      const hasEditButton = await editButton.isVisible().catch(() => false);

      if (hasEditButton) {
        await editButton.click();
        // 等待编辑模式激活
        await expect(
          page.locator('button:has-text("保存"), button:has-text("取消")')
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  // ========================================================================
  // 数字分身配置 (Presence Settings)
  // ========================================================================

  test.describe("数字分身配置", () => {
    test("数字分身状态 API 应返回数据", async ({ request }) => {
      const response = await request.get("/api/backend/presence");

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expectApiSuccess(json);
      expect(json.data).toHaveProperty("status");
      expect(json.data).toHaveProperty("message");
    });

    test("数字分身配置页面应正常加载", async ({ page }) => {
      const validator = new PageValidator(page);
      await validator.goto("/admin/settings/presence");

      // 验证 URL
      expect(page.url()).toContain("/admin/settings/presence");

      await validator.expectNoErrors();
      await validator.expectNotErrorPage();

      // 等待页面加载完成
      await page.waitForLoadState("domcontentloaded");

      // 检查页面标题或关键元素
      await expect(
        page.locator('h1:has-text("数字分身")')
      ).toBeVisible({ timeout: 10000 });

      // 截图
      await page.screenshot({
        path: "test-results/screenshots/admin-settings-presence.png",
        fullPage: true,
      });
    });

    test("当前状态卡片应显示状态信息", async ({ page }) => {
      await page.goto("/admin/settings/presence");
      await page.waitForLoadState("networkidle");

      // 等待状态卡片加载
      await expect(page.locator('text="当前状态"')).toBeVisible({
        timeout: 10000,
      });

      // 刷新按钮应存在
      const refreshButton = page.locator('button >> svg.lucide-refresh-cw');
      await expect(refreshButton.first()).toBeVisible();
    });

    test("手动覆盖状态功能应存在", async ({ page }) => {
      await page.goto("/admin/settings/presence");
      await page.waitForLoadState("networkidle");

      // 检查手动覆盖区域
      await expect(page.locator('text="手动设置状态"')).toBeVisible({
        timeout: 10000,
      });

      // 检查状态类型按钮
      await expect(page.locator('button:has-text("编程中")')).toBeVisible();
      await expect(page.locator('button:has-text("游戏中")')).toBeVisible();
    });

    test("Steam 配置区域应存在", async ({ page }) => {
      await page.goto("/admin/settings/presence");
      await page.waitForLoadState("networkidle");

      // 检查 Steam 配置区域
      await expect(page.locator('text="Steam 配置"')).toBeVisible({
        timeout: 10000,
      });

      // 检查 API Key 输入框
      await expect(page.locator("#steamKey")).toBeVisible();
    });
  });

  // ========================================================================
  // 邮件模板管理 (Email Templates)
  // ========================================================================

  test.describe("邮件模板管理", () => {
    test("邮件模板 API 应返回数据", async ({ request }) => {
      const token = await loginAndGetToken(request);
      if (!token) {
        test.skip(true, "登录频率限制触发");
        return;
      }

      const response = await request.get("/api/backend/admin/email-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expectApiSuccess(json);
      expect(Array.isArray(json.data)).toBeTruthy();
    });

    test("邮件模板页面应正常加载", async ({ page }) => {
      const validator = new PageValidator(page);
      await validator.goto("/admin/settings/email-templates");

      // 验证 URL
      expect(page.url()).toContain("/admin/settings/email-templates");

      await validator.expectNoErrors();
      await validator.expectNotErrorPage();

      // 等待页面加载完成
      await page.waitForLoadState("domcontentloaded");

      // 检查页面标题
      await expect(page.locator('h1:has-text("邮件模板")')).toBeVisible({
        timeout: 10000,
      });

      // 截图
      await page.screenshot({
        path: "test-results/screenshots/admin-settings-email-templates.png",
        fullPage: true,
      });
    });

    test("邮件模板列表应显示模板卡片", async ({ page }) => {
      await page.goto("/admin/settings/email-templates");
      await page.waitForLoadState("networkidle");

      // 等待模板列表加载
      // 如果有模板，应该显示编辑按钮
      const editButton = page.locator('button >> svg.lucide-edit-2').first();
      const hasTemplates = await editButton.isVisible().catch(() => false);

      if (hasTemplates) {
        // 点击编辑按钮应打开对话框
        await editButton.click();

        await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
      }
    });
  });

  // ========================================================================
  // 纪念日管理 (Anniversaries)
  // ========================================================================

  test.describe("纪念日管理", () => {
    test("纪念日 API 应返回数据", async ({ request }) => {
      const token = await loginAndGetToken(request);
      if (!token) {
        test.skip(true, "登录频率限制触发");
        return;
      }

      const response = await request.get("/api/backend/admin/anniversaries", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 可能返回空列表，但应该成功
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expectApiSuccess(json);
    });

    test("纪念日页面应正常加载", async ({ page }) => {
      const validator = new PageValidator(page);
      await validator.goto("/admin/settings/anniversaries");

      // 验证 URL
      expect(page.url()).toContain("/admin/settings/anniversaries");

      await validator.expectNoErrors();
      await validator.expectNotErrorPage();

      // 等待页面加载完成
      await page.waitForLoadState("domcontentloaded");

      // 检查页面标题或添加按钮
      await expect(
        page.locator('h1:has-text("纪念日")')
      ).toBeVisible({ timeout: 10000 });

      // 截图
      await page.screenshot({
        path: "test-results/screenshots/admin-settings-anniversaries.png",
        fullPage: true,
      });
    });
  });

  // ========================================================================
  // 移动端布局
  // ========================================================================

  test("设置页面移动端布局应正确", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto("/admin/settings/presence");
    await page.waitForLoadState("networkidle");

    // 验证页面加载
    await expect(page.locator('text="当前状态"')).toBeVisible({
      timeout: 10000,
    });

    // 截图
    await page.screenshot({
      path: "test-results/screenshots/admin-settings-mobile.png",
      fullPage: true,
    });
  });
});
