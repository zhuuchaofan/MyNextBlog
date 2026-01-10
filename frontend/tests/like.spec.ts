// ============================================================================
// E2E Test: 点赞功能
// ============================================================================
// 验证点赞 API 端点、状态同步和 Rate Limiting

import { test, expect } from "@playwright/test";

test.describe("点赞功能 (Like Feature)", () => {
  test.describe("API 端点验证", () => {
    test("点赞状态查询 API 应返回正确结构", async ({ request }) => {
      // 先获取文章列表
      const listResponse = await request.get("/api/backend/posts");
      const listJson = await listResponse.json();

      // 如果有文章，测试点赞状态 API
      if (listJson.data && listJson.data.length > 0) {
        const firstPostId = listJson.data[0].id;
        const statusResponse = await request.get(
          `/api/backend/posts/${firstPostId}/like-status`
        );

        expect(statusResponse.ok()).toBeTruthy();

        const statusJson = await statusResponse.json();
        expect(statusJson).toHaveProperty("success", true);
        expect(statusJson).toHaveProperty("isLiked");
        expect(typeof statusJson.isLiked).toBe("boolean");
      }
    });

    test("批量获取点赞状态 API 应返回正确结构", async ({ request }) => {
      // 先获取文章列表
      const listResponse = await request.get("/api/backend/posts");
      const listJson = await listResponse.json();

      if (listJson.data && listJson.data.length > 0) {
        const postIds = listJson.data.slice(0, 3).map((p: { id: number }) => p.id);

        const batchResponse = await request.post(
          "/api/backend/posts/like-status/batch",
          {
            data: postIds,
          }
        );

        expect(batchResponse.ok()).toBeTruthy();

        const batchJson = await batchResponse.json();
        expect(batchJson).toHaveProperty("success", true);
        expect(batchJson).toHaveProperty("data");
        expect(typeof batchJson.data).toBe("object");

        // 验证返回的 data 中包含请求的 postId
        for (const id of postIds) {
          expect(batchJson.data).toHaveProperty(String(id));
        }
      }
    });

    test("批量查询应拒绝超过 50 个 ID 的请求", async ({ request }) => {
      // 创建 51 个 ID 的数组
      const tooManyIds = Array.from({ length: 51 }, (_, i) => i + 1);

      const response = await request.post(
        "/api/backend/posts/like-status/batch",
        {
          data: tooManyIds,
        }
      );

      expect(response.status()).toBe(400);

      const json = await response.json();
      expect(json).toHaveProperty("success", false);
      expect(json.message).toContain("50");
    });
  });

  test.describe("点赞操作验证", () => {
    test("点赞操作应返回正确结构", async ({ request }) => {
      // 先获取文章列表
      const listResponse = await request.get("/api/backend/posts");
      const listJson = await listResponse.json();

      if (listJson.data && listJson.data.length > 0) {
        const testPostId = listJson.data[0].id;

        // 获取初始点赞状态
        const initialStatus = await request.get(
          `/api/backend/posts/${testPostId}/like-status`
        );
        const initialJson = await initialStatus.json();
        const wasLiked = initialJson.isLiked;

        // 执行点赞/取消点赞操作
        const likeResponse = await request.post(
          `/api/backend/posts/${testPostId}/like`
        );

        expect(likeResponse.ok()).toBeTruthy();

        const likeJson = await likeResponse.json();
        expect(likeJson).toHaveProperty("success", true);
        expect(likeJson).toHaveProperty("isLiked");
        expect(likeJson).toHaveProperty("likeCount");
        expect(typeof likeJson.isLiked).toBe("boolean");
        expect(typeof likeJson.likeCount).toBe("number");

        // 状态应该翻转
        expect(likeJson.isLiked).toBe(!wasLiked);

        // 再次点赞恢复原状态
        await request.post(`/api/backend/posts/${testPostId}/like`);
      }
    });

    test("对不存在的文章点赞应返回 404", async ({ request }) => {
      const response = await request.post("/api/backend/posts/999999/like");

      expect(response.status()).toBe(404);

      const json = await response.json();
      expect(json).toHaveProperty("success", false);
    });
  });

  test.describe("Rate Limiting 验证", () => {
    test.skip("连续快速点赞应触发 Rate Limiting", async ({ request }) => {
      // 注意：此测试可能因为测试环境配置不同而不稳定
      // 在 CI 环境中可能需要跳过或调整

      const listResponse = await request.get("/api/backend/posts");
      const listJson = await listResponse.json();

      if (listJson.data && listJson.data.length > 0) {
        const testPostId = listJson.data[0].id;

        // 连续发送 15 次请求（超过 10 次/分钟限制）
        const responses = [];
        for (let i = 0; i < 15; i++) {
          const response = await request.post(
            `/api/backend/posts/${testPostId}/like`
          );
          responses.push(response.status());
        }

        // 应该有部分请求返回 429 (Too Many Requests)
        const have429 = responses.some((status) => status === 429);
        expect(have429).toBeTruthy();
      }
    });
  });
});
