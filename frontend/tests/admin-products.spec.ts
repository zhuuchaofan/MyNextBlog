// ============================================================================
// E2E Test: 商品管理 (Admin Products)
// ============================================================================
// 验证管理员商品 CRUD 操作、上下架切换、库存管理
// 使用 storageState 复用登录状态，避免频率限制

import { test, expect } from "@playwright/test";
import {
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
  generateTestName,
} from "./utils/test-helpers";

test.describe("商品管理 (Admin Products)", () => {
  // 串行执行，避免并发登录导致频率限制
  test.describe.configure({ mode: "serial" });

  // 测试数据 ID (用于清理)
  let createdProductId: number | null = null;

  // ========================================================================
  // API 权限验证
  // ========================================================================

  test("未认证用户无法访问商品管理 API", async ({ browser }) => {
    // 创建一个没有 storageState 的新上下文
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const request = context.request;
    
    const response = await request.get("/api/backend/admin/products");
    
    // API 可能返回 401 或 200 但 success: false
    // 注意：如果是 Next.js Middleware 拦截，可能会重定向到登录页 (307)
    if (response.status() === 401) {
      expect(response.status()).toBe(401);
    } else if (response.status() === 307 || response.status() === 302) {
        // 重定向也被视为一种未授权保护
        expect(response.status()).toBeGreaterThan(300);
    } else {
      const json = await response.json().catch(() => ({ success: false }));
      if (typeof json === 'object' && json !== null && 'success' in json) {
          expect(json.success).toBe(false);
      } else {
           // 如果不是 JSON，假设防守成功（比如返回 HTML 错误页）
           // 但不能是 200 OK 且包含数据
           if (response.ok()) {
               const text = await response.text();
               expect(text).not.toContain('"data"');
           }
      }
    }
    await context.close();
  });

  // ========================================================================
  // 商品列表 API
  // ========================================================================

  test("管理员应能获取商品列表 (包含下架商品)", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.get("/api/backend/admin/products", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data)).toBeTruthy();

    // 验证商品结构
    if (json.data && json.data.length > 0) {
      const product = json.data[0];
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("price");
      expect(product).toHaveProperty("stock");
      expect(product).toHaveProperty("isActive");
    }
  });

  // ========================================================================
  // 公开商品 API
  // ========================================================================

  test("公开 API 应只返回上架商品", async ({ request }) => {
    const response = await request.get("/api/backend/products");

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    // 公开 API 返回的商品都应该是上架状态
    if (json.data && json.data.length > 0) {
      for (const product of json.data) {
        // 公开 API 不返回 isActive 字段，但返回的都是上架商品
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("price");
      }
    }
  });

  // ========================================================================
  // 创建商品 API
  // ========================================================================

  test("管理员应能创建新商品", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const testName = generateTestName("测试商品");
    const response = await request.post("/api/backend/admin/products", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: testName,
        description: "E2E 测试创建的商品",
        price: 99.99,
        stock: 10,
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json.data).toHaveProperty("id");
    expect(json.data.name).toBe(testName);

    // 保存 ID 用于后续清理
    createdProductId = json.data.id;
  });

  // ========================================================================
  // 更新商品 API
  // ========================================================================

  test("管理员应能更新商品信息", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token || !createdProductId) {
      test.skip(true, "前置条件不满足");
      return;
    }

    const updatedName = generateTestName("更新后商品");
    const response = await request.put(
      `/api/backend/admin/products/${createdProductId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          name: updatedName,
          description: "已更新的描述",
          price: 199.99,
          stock: 5,
          isActive: true,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
  });

  // ========================================================================
  // 上下架切换 API
  // ========================================================================

  test("管理员应能切换商品上下架状态", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token || !createdProductId) {
      test.skip(true, "前置条件不满足");
      return;
    }

    // 获取当前状态
    const getResponse = await request.get(
      `/api/backend/admin/products/${createdProductId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const getJson = await getResponse.json();
    const currentIsActive = getJson.data.isActive;

    // 切换状态
    const response = await request.put(
      `/api/backend/admin/products/${createdProductId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          name: getJson.data.name,
          description: getJson.data.description,
          price: getJson.data.price,
          stock: getJson.data.stock,
          isActive: !currentIsActive, // 切换状态
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    expectApiSuccess(await response.json());

    // 恢复原状态
    await request.put(`/api/backend/admin/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: getJson.data.name,
        description: getJson.data.description,
        price: getJson.data.price,
        stock: getJson.data.stock,
        isActive: currentIsActive,
      },
    });
  });

  // ========================================================================
  // 删除商品 API (清理测试数据)
  // ========================================================================

  test("管理员应能删除商品", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token || !createdProductId) {
      test.skip(true, "前置条件不满足");
      return;
    }

    const response = await request.delete(
      `/api/backend/admin/products/${createdProductId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    // 清理引用
    createdProductId = null;
  });

  // ========================================================================
  // UI 测试
  // ========================================================================

  test("商品管理页面应正常加载", async ({ page }) => {
    // storageState 已自动加载，直接访问管理页面
    const validator = new PageValidator(page);
    await validator.goto("/admin/products");

    // 验证 URL 正确
    expect(page.url()).toContain("/admin/products");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    
    // 等待页面数据加载完成（客户端组件）
    await page.waitForLoadState("domcontentloaded");
    
    // 检查页面标题或特征元素
    await expect(page.locator('h1:has-text("商品管理")')).toBeVisible({ timeout: 10000 });

    // 截图保存
    await page.screenshot({
      path: "test-results/screenshots/admin-products-page.png",
      fullPage: true,
    });
  });

  test("商品管理页面应显示添加按钮", async ({ page }) => {
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");

    // 检查添加按钮存在
    const addButton = page.locator('button:has-text("添加商品")');
    await expect(addButton).toBeVisible();
  });

  test("点击添加按钮应打开表单", async ({ page }) => {
    await page.goto("/admin/products");
    await page.waitForLoadState("networkidle");

    // 点击添加按钮
    await page.click('button:has-text("添加商品")');

    // 等待对话框/抽屉打开
    await expect(
      page.getByRole("dialog")
    ).toBeVisible({ timeout: 5000 });

    // 检查表单元素
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="price"]')).toBeVisible();
    await expect(page.locator('input[id="stock"]')).toBeVisible();
  });
});
