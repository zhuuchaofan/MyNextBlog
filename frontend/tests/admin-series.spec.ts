// ============================================================================
// E2E Test: 系列管理 (Series)
// ============================================================================
// 验证系列 CRUD 操作和文章关联

import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
} from "./utils/test-helpers";

test.describe("系列管理 (Series)", () => {
  test.describe.configure({ mode: "serial" });

  // ========================================================================
  // 公开 API (无需登录)
  // ========================================================================

  test("公开用户应能获取系列列表", async ({ request }) => {
    const response = await request.get("/api/backend/series");
    
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("公开用户应能获取单个系列详情 (若存在)", async ({ request }) => {
    // 先获取列表
    const listRes = await request.get("/api/backend/series");
    const listJson = await listRes.json();

    if (listJson.data && listJson.data.length > 0) {
      const seriesId = listJson.data[0].id;
      
      const detailRes = await request.get(`/api/backend/series/${seriesId}`);
      expect(detailRes.ok()).toBeTruthy();
      
      const detailJson = await detailRes.json();
      expectApiSuccess(detailJson);
      expect(detailJson.data).toHaveProperty("id", seriesId);
      expect(detailJson.data).toHaveProperty("title");
    }
  });

  test("获取不存在的系列应返回 404", async ({ request }) => {
    const response = await request.get("/api/backend/series/999999");
    expect(response.status()).toBe(404);
  });

  test("公开用户应能获取系列下的文章列表", async ({ request }) => {
    // 先获取系列列表
    const listRes = await request.get("/api/backend/series");
    const listJson = await listRes.json();

    if (listJson.data && listJson.data.length > 0) {
      const seriesId = listJson.data[0].id;
      
      const postsRes = await request.get(`/api/backend/series/${seriesId}/posts`);
      expect(postsRes.ok()).toBeTruthy();
      
      const postsJson = await postsRes.json();
      expectApiSuccess(postsJson);
      expect(Array.isArray(postsJson.data)).toBeTruthy();
    }
  });

  // ========================================================================
  // 权限验证
  // ========================================================================

  test("未登录用户无法创建系列", async ({ request }) => {
    const response = await request.post("/api/backend/series", {
      data: { title: "Test Series", description: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  test("未登录用户无法更新系列", async ({ request }) => {
    const response = await request.put("/api/backend/series/1", {
      data: { title: "Updated" },
    });
    expect(response.status()).toBe(401);
  });

  test("未登录用户无法删除系列", async ({ request }) => {
    const response = await request.delete("/api/backend/series/1");
    expect(response.status()).toBe(401);
  });

  // ========================================================================
  // 管理员 API
  // ========================================================================

  test("管理员应能获取下一篇文章排序号", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 先获取系列列表
    const listRes = await request.get("/api/backend/series", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listJson = await listRes.json();

    if (listJson.data && listJson.data.length > 0) {
      const seriesId = listJson.data[0].id;
      
      const orderRes = await request.get(`/api/backend/series/${seriesId}/next-order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(orderRes.ok()).toBeTruthy();
      
      const orderJson = await orderRes.json();
      expectApiSuccess(orderJson);
      expect(typeof orderJson.data).toBe("number");
    }
  });

  // ========================================================================
  // UI 测试
  // ========================================================================

  test("系列管理页面应正常加载", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/admin/series");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    await validator.expectTitleContains("系列");

    await page.screenshot({
      path: "test-results/screenshots/admin-series-page.png",
      fullPage: true,
    });
  });

  test("公开系列列表页应正常加载", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/series");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    await page.screenshot({
      path: "test-results/screenshots/series-public-page.png",
      fullPage: true,
    });
  });
});
