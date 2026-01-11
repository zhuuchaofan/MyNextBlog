// ============================================================================
// E2E Test: 文章管理 (Admin Posts)
// ============================================================================
// 验证管理员文章 CRUD 操作、可见性切换、回收站功能
// 策略：先记录失败，后分析原因

import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
  expectPaginatedResponse,
} from "./utils/test-helpers";

test.describe("文章管理 (Admin Posts)", () => {
  // 串行执行，避免并发登录导致频率限制
  test.describe.configure({ mode: "serial" });

  // ========================================================================
  // API 权限验证
  // ========================================================================

  test("未登录用户无法访问管理员文章列表", async ({ request }) => {
    const response = await request.get("/api/backend/posts/admin");
    expect(response.status()).toBe(401);
  });

  test("未登录用户无法创建文章", async ({ request }) => {
    const response = await request.post("/api/backend/posts", {
      data: { title: "Test", content: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  test("未登录用户无法删除文章", async ({ request }) => {
    const response = await request.delete("/api/backend/posts/1");
    expect(response.status()).toBe(401);
  });

  // ========================================================================
  // 管理员文章列表 API
  // ========================================================================

  test("管理员应能获取文章列表 (包含隐藏文章)", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.get("/api/backend/posts/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectPaginatedResponse(json);

    // 验证文章结构
    if (json.data && json.data.length > 0) {
      const post = json.data[0];
      expect(post).toHaveProperty("id");
      expect(post).toHaveProperty("title");
      expect(post).toHaveProperty("isHidden");
    }
  });

  test("分页参数应正确工作", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 测试第 1 页，每页 5 条
    const response = await request.get("/api/backend/posts/admin?page=1&pageSize=5", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectPaginatedResponse(json);
    
    // 验证分页元数据
    expect(json.meta).toHaveProperty("page", 1);
    expect(json.meta).toHaveProperty("pageSize", 5);
    expect(json.meta).toHaveProperty("totalCount");
    expect(json.meta).toHaveProperty("totalPages");
  });

  // ========================================================================
  // 单篇文章详情 API
  // ========================================================================

  test("管理员应能获取单篇文章详情 (包含隐藏)", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 先获取文章列表
    const listRes = await request.get("/api/backend/posts/admin?page=1&pageSize=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listJson = await listRes.json();

    if (listJson.data && listJson.data.length > 0) {
      const postId = listJson.data[0].id;

      // 获取文章详情
      const detailRes = await request.get(`/api/backend/posts/admin/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(detailRes.ok()).toBeTruthy();
      const detailJson = await detailRes.json();
      expectApiSuccess(detailJson);

      expect(detailJson.data).toHaveProperty("id", postId);
      expect(detailJson.data).toHaveProperty("title");
      expect(detailJson.data).toHaveProperty("content");
    }
  });

  test("公开 API 不应返回隐藏文章", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 获取管理员列表找一篇隐藏文章
    const adminRes = await request.get("/api/backend/posts/admin?page=1&pageSize=50", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const adminJson = await adminRes.json();

    const hiddenPost = adminJson.data?.find((p: { isHidden: boolean }) => p.isHidden);
    
    if (hiddenPost) {
      // 使用公开 API 尝试获取隐藏文章
      const publicRes = await request.get(`/api/backend/posts/${hiddenPost.id}`);
      
      // 应返回 404 (文章不存在)
      expect(publicRes.status()).toBe(404);
    }
  });

  // ========================================================================
  // 可见性切换 API
  // ========================================================================

  test("管理员应能切换文章可见性", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 获取一篇文章
    const listRes = await request.get("/api/backend/posts/admin?page=1&pageSize=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listJson = await listRes.json();

    if (listJson.data && listJson.data.length > 0) {
      const postId = listJson.data[0].id;
      const originalHidden = listJson.data[0].isHidden;

      // 切换可见性
      const toggleRes = await request.patch(`/api/backend/posts/${postId}/visibility`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(toggleRes.ok()).toBeTruthy();
      const toggleJson = await toggleRes.json();
      expectApiSuccess(toggleJson);
      
      // 验证状态翻转
      expect(toggleJson.isHidden).toBe(!originalHidden);

      // 再次切换回原状态
      await request.patch(`/api/backend/posts/${postId}/visibility`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  // ========================================================================
  // 回收站 API
  // ========================================================================

  test("管理员应能访问回收站列表", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.get("/api/backend/posts/trash", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectPaginatedResponse(json);
  });

  // ========================================================================
  // UI 测试: 文章管理页面
  // ========================================================================

  test("文章管理页面应正常加载", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/admin/posts");

    // 核心断言
    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    await validator.expectTitleContains("文章");

    // 截图保存
    await page.screenshot({
      path: "test-results/screenshots/admin-posts-page.png",
      fullPage: true,
    });
  });

  test("回收站页面应正常加载", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/admin/trash");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    await validator.expectTitleContains("回收站");

    await page.screenshot({
      path: "test-results/screenshots/admin-trash-page.png",
      fullPage: true,
    });
  });

  // ========================================================================
  // 公开文章列表 API
  // ========================================================================

  test("公开文章列表 API 应返回正确结构", async ({ request }) => {
    const response = await request.get("/api/backend/posts");

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectPaginatedResponse(json);

    // 验证公开文章不包含隐藏状态
    if (json.data && json.data.length > 0) {
      for (const post of json.data) {
        // 公开列表中的文章 isHidden 应为 false (或字段不存在)
        expect(post.isHidden ?? false).toBe(false);
      }
    }
  });

  test("搜索功能应正常工作", async ({ request }) => {
    // 使用一个常见词进行搜索
    const response = await request.get("/api/backend/posts?search=文章");

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectPaginatedResponse(json);
  });
});
