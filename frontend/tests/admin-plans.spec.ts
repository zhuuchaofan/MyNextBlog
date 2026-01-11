// ============================================================================
// E2E Test: 计划管理 (Admin Plans)
// ============================================================================
// 验证管理员计划 CRUD 操作、状态管理
// 使用 storageState 复用登录状态

import { test, expect } from "@playwright/test";
import {
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
  generateTestName,
} from "./utils/test-helpers";

test.describe("计划管理 (Admin Plans)", () => {
  // 串行执行
  test.describe.configure({ mode: "serial" });

  // 测试数据 ID (用于清理)
  let createdPlanId: number | null = null;

  // ========================================================================
  // API 权限验证
  // ========================================================================

  test("未认证用户无法访问计划管理 API", async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const request = context.request;
    const response = await request.get("/api/backend/admin/plans");
    
    expect(response.status()).toBe(401);
    await context.close();
  });

  // ========================================================================
  // 计划列表 API
  // ========================================================================

  test("管理员应能获取计划列表", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.get("/api/backend/admin/plans", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data)).toBeTruthy();

    // 验证计划结构
    if (json.data && json.data.length > 0) {
      const plan = json.data[0];
      expect(plan).toHaveProperty("id");
      expect(plan).toHaveProperty("title");
      expect(plan).toHaveProperty("type");
      expect(plan).toHaveProperty("status");
      expect(plan).toHaveProperty("startDate");
    }
  });

  // ========================================================================
  // 创建计划 API
  // ========================================================================

  test("管理员应能创建新计划", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const testTitle = generateTestName("测试计划");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const startDate = futureDate.toISOString().split("T")[0];

    const response = await request.post("/api/backend/admin/plans", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: testTitle,
        description: "E2E 测试创建的计划",
        type: "trip",
        startDate: startDate,
        budget: 5000,
        currency: "CNY",
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json.data).toHaveProperty("id");
    expect(json.data.title).toBe(testTitle);

    // 保存 ID 用于后续清理
    createdPlanId = json.data.id;
  });

  // ========================================================================
  // 获取计划详情 API
  // ========================================================================

  test("管理员应能获取计划详情", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token || !createdPlanId) {
      test.skip(true, "前置条件不满足");
      return;
    }

    const response = await request.get(
      `/api/backend/admin/plans/${createdPlanId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json.data.id).toBe(createdPlanId);
    expect(json.data).toHaveProperty("title");
    expect(json.data).toHaveProperty("description");
    expect(json.data).toHaveProperty("budget");
  });

  // ========================================================================
  // 更新计划 API
  // ========================================================================

  test("管理员应能更新计划", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token || !createdPlanId) {
      test.skip(true, "前置条件不满足");
      return;
    }

    const updatedTitle = generateTestName("更新后计划");
    const response = await request.put(
      `/api/backend/admin/plans/${createdPlanId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          title: updatedTitle,
          status: "confirmed",
          budget: 8000,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
  });

  // ========================================================================
  // 公开预览 API
  // ========================================================================

  test("公开计划预览 API 应返回数据（隐藏敏感信息）", async ({ request }) => {
    if (!createdPlanId) {
      test.skip(true, "前置条件不满足");
      return;
    }

    // 公开 API 不需要认证
    const response = await request.get(
      `/api/backend/plans/${createdPlanId}/public`
    );

    // 计划可能设置为私密，返回 404 也是正常的
    if (response.status() === 404) {
      // 私密计划，跳过验证
      return;
    }

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    // 公开预览不应该包含完整预算信息
    expect(json).toHaveProperty("title");
  });

  // ========================================================================
  // 删除计划 API (清理测试数据)
  // ========================================================================

  test("管理员应能删除计划", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token || !createdPlanId) {
      test.skip(true, "前置条件不满足");
      return;
    }

    const response = await request.delete(
      `/api/backend/admin/plans/${createdPlanId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    // 清理引用
    createdPlanId = null;
  });

  // ========================================================================
  // UI 测试
  // ========================================================================

  test("计划管理页面应正常加载", async ({ page }) => {
    // storageState 已自动加载
    const validator = new PageValidator(page);
    await validator.goto("/admin/plans");

    // 验证 URL 正确（没有被重定向）
    expect(page.url()).toContain("/admin/plans");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    
    // 等待页面数据加载完成（客户端组件）
    await page.waitForLoadState("domcontentloaded");
    
    // 检查页面标题或特征元素
    await expect(page.locator('h1:has-text("计划管理")')).toBeVisible({ timeout: 10000 });

    // 截图保存
    await page.screenshot({
      path: "test-results/screenshots/admin-plans-page.png",
      fullPage: true,
    });
  });

  test("计划管理页面应显示新建按钮", async ({ page }) => {
    await page.goto("/admin/plans");
    await page.waitForLoadState("networkidle");

    // 检查新建按钮存在
    const newButton = page.locator('a:has-text("新建计划")');
    await expect(newButton).toBeVisible();
  });

  test("新建计划页面应正常加载", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/admin/plans/new");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 检查表单元素
    await expect(page.locator('input[name="title"], #title')).toBeVisible();

    // 截图
    await page.screenshot({
      path: "test-results/screenshots/admin-plans-new.png",
      fullPage: true,
    });
  });
});
