// ============================================================================
// E2E Test: 管理员评论管理页面
// ============================================================================
// 验证管理员登录后评论管理功能

import { test, expect, Page, BrowserContext } from "@playwright/test";

// 共享登录状态
let authToken: string | null = null;

// 辅助函数：使用 API 登录并获取 Token
async function loginAsAdmin(context: BrowserContext): Promise<boolean> {
  // 通过 API 登录获取 token
  const loginResponse = await context.request.post("/api/auth/login", {
    data: {
      username: "chaofan",
      password: "chaofan0920",
    },
  });

  if (loginResponse.status() === 429) {
    return false; // 频率限制
  }

  if (loginResponse.ok()) {
    // 登录成功后，cookie 会自动设置
    const cookies = await context.cookies();
    const tokenCookie = cookies.find((c) => c.name === "token");
    if (tokenCookie) {
      authToken = tokenCookie.value;
      return true;
    }
  }
  return false;
}

test.describe("管理员评论管理 (Admin Comments)", () => {
  // 串行执行，避免并发登录导致频率限制
  test.describe.configure({ mode: "serial" });

  test("管理员应能访问评论管理 API", async ({ request }) => {
    // 先登录获取 token
    const loginResponse = await request.post("/api/backend/auth/login", {
      data: {
        username: "chaofan",
        password: "chaofan0920",
      },
    });

    if (loginResponse.status() === 429) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    expect(loginResponse.ok()).toBeTruthy();
    const loginJson = await loginResponse.json();
    const token = loginJson.token;

    // 访问评论管理 API
    const response = await request.get("/api/backend/comments/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("管理员评论列表应显示评论详情", async ({ request }) => {
    // 登录
    const loginResponse = await request.post("/api/backend/auth/login", {
      data: {
        username: "chaofan",
        password: "chaofan0920",
      },
    });

    if (loginResponse.status() === 429) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const loginJson = await loginResponse.json();
    const token = loginJson.token;

    // 获取评论列表
    const response = await request.get("/api/backend/comments/admin?page=1&pageSize=10", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();

    if (json.data && json.data.length > 0) {
      const comment = json.data[0];
      // 验证评论结构
      expect(comment).toHaveProperty("id");
      expect(comment).toHaveProperty("content");
      expect(comment).toHaveProperty("isApproved");
    }
  });

  test("批量审核 API 应正常工作", async ({ request }) => {
    // 登录
    const loginResponse = await request.post("/api/backend/auth/login", {
      data: {
        username: "chaofan",
        password: "chaofan0920",
      },
    });

    if (loginResponse.status() === 429) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const loginJson = await loginResponse.json();
    const token = loginJson.token;

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
      expect(toggleJson).toHaveProperty("success", true);

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

  test("评论管理页面应可访问 (已登录)", async ({ page, context }) => {
    // 尝试登录
    const loggedIn = await loginAsAdmin(context);

    if (!loggedIn) {
      test.skip(true, "无法登录 (可能触发频率限制)");
      return;
    }

    // 访问评论管理页面
    await page.goto("/admin/comments");
    await page.waitForLoadState("networkidle");

    // 验证页面加载成功
    // 应该看到 "评论管理" 或类似标题
    const pageContent = await page.content();
    expect(
      pageContent.includes("评论") || pageContent.includes("comment") || pageContent.includes("Comment")
    ).toBeTruthy();
  });
});
