// ============================================================================
// E2E Test: 评论功能
// ============================================================================
// 验证评论 API 和交互功能

import { test, expect } from "@playwright/test";

test.describe("评论功能 (Comments)", () => {
  test("评论列表 API 应返回正确结构", async ({ request }) => {
    // 先获取一篇文章
    const postsResponse = await request.get("/api/backend/posts");
    const postsJson = await postsResponse.json();

    if (postsJson.data && postsJson.data.length > 0) {
      const postId = postsJson.data[0].id;

      // 获取该文章的评论
      const commentsResponse = await request.get(
        `/api/backend/comments?postId=${postId}`
      );

      expect(commentsResponse.ok()).toBeTruthy();

      const commentsJson = await commentsResponse.json();
      expect(commentsJson).toHaveProperty("success", true);
      expect(commentsJson).toHaveProperty("data");
      expect(Array.isArray(commentsJson.data)).toBeTruthy();
    }
  });

  test("未登录时提交评论需要提供昵称", async ({ request }) => {
    // 先获取一篇文章
    const postsResponse = await request.get("/api/backend/posts");
    const postsJson = await postsResponse.json();

    if (postsJson.data && postsJson.data.length > 0) {
      const postId = postsJson.data[0].id;

      // 尝试提交不完整的评论
      const response = await request.post("/api/backend/comments", {
        data: {
          postId: postId,
          content: "测试评论内容",
          // 缺少 guestName
        },
      });

      // 应该返回错误 (400 或其他)
      // 不期望成功
      expect(response.status()).not.toBe(201);
    }
  });
});
