// ============================================================================
// E2E Test: 管理员评论管理页面
// ============================================================================
// 验证管理员登录后评论管理功能
// 使用标准化测试工具确保可靠的错误检测

import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
  expectPaginatedResponse,
} from "./utils/test-helpers";

test.describe("管理员评论管理 (Admin Comments)", () => {
  // 串行执行，避免并发登录导致频率限制
  test.describe.configure({ mode: "serial" });

  // ========================================================================
  // API 测试
  // ========================================================================

  test("管理员应能访问评论管理 API", async ({ request }) => {
    const token = await loginAndGetToken(request);

    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 访问评论管理 API
    const response = await request.get("/api/backend/comments/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    
    // 使用标准化验证
    expectPaginatedResponse(json);
  });

  test("管理员评论列表应显示评论详情", async ({ request }) => {
    const token = await loginAndGetToken(request);

    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.get("/api/backend/comments/admin?page=1&pageSize=10", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectPaginatedResponse(json);

    if (json.data && json.data.length > 0) {
      const comment = json.data[0];
      // 验证评论结构
      expect(comment).toHaveProperty("id");
      expect(comment).toHaveProperty("content");
      expect(comment).toHaveProperty("isApproved");
      // userAvatar 字段：访客评论可能不包含此字段 (后端 WhenWritingNull)
      // 如果存在则验证类型为 string
      if ("userAvatar" in comment) {
        expect(typeof comment.userAvatar).toBe("string");
      }
    }
  });

  test("批量审核 API 应正常工作", async ({ request }) => {
    const token = await loginAndGetToken(request);

    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    // 获取评论列表找到一个评论 ID
    const listResponse = await request.get("/api/backend/comments/admin?page=1&pageSize=10", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const listJson = await listResponse.json();

    if (listJson.data && listJson.data.length > 0) {
      const commentId = listJson.data[0].id;

      // 测试切换审核状态 API
      const toggleResponse = await request.patch(
        `/api/backend/comments/${commentId}/approval`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      expect(toggleResponse.ok()).toBeTruthy();
      const toggleJson = await toggleResponse.json();
      expectApiSuccess(toggleJson);

      // 再次切换回来
      await request.patch(`/api/backend/comments/${commentId}/approval`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test("未登录用户应无法访问评论管理 API", async ({ request }) => {
    const response = await request.get("/api/backend/comments/admin");
    expect(response.status()).toBe(401);
  });

  // ========================================================================
  // UI 测试 (关键: 检测客户端渲染错误)
  // ========================================================================

  test("评论管理页面应正常加载 (无 JS 错误) 并截图验证", async ({ page, context }) => {
    // 尝试登录
    const loggedIn = await loginAsAdmin(context);

    if (!loggedIn) {
      test.skip(true, "无法登录 (可能触发频率限制)");
      return;
    }

    // 使用 PageValidator 进行完整验证
    const validator = new PageValidator(page);
    await validator.goto("/admin/comments");

    // ✅ 核心断言：无 JS 错误
    await validator.expectNoErrors();

    // ✅ 核心断言：不是错误页面
    await validator.expectNotErrorPage();

    // ✅ 核心断言：页面标题正确
    await validator.expectTitleContains("评论");

    // ✅ 截图验证：保存页面完整状态用于视觉验证
    await page.screenshot({
      path: "test-results/screenshots/admin-comments-page.png",
      fullPage: true,
    });

    // ✅ 头像验证：检查头像元素渲染
    const avatarImages = page.locator('img[class*="avatar"], [data-slot="avatar-image"]');
    const avatarCount = await avatarImages.count();

    if (avatarCount > 0) {
      // 验证前 5 个头像的 src 属性
      for (let i = 0; i < Math.min(avatarCount, 5); i++) {
        const img = avatarImages.nth(i);
        const src = await img.getAttribute("src");
        expect(src, `头像 ${i + 1} 应有 src 属性`).toBeTruthy();
        expect(src, `头像 ${i + 1} 的 src 应是有效 URL`).toMatch(/^https?:\/\//);
      }
    }
  });

  test("评论管理页面应显示评论列表或空状态", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);

    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/admin/comments");
    
    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 页面应该显示表格或"暂无数据"
    const content = await page.content();
    const hasTable = content.includes("TableRow") || content.includes("table") || content.includes("<tr");
    const hasEmptyState = content.includes("暂无数据") || content.includes("暂无评论");
    
    expect(hasTable || hasEmptyState).toBeTruthy();
  });


});

