// ============================================================================
// E2E Test: 文章详情页
// ============================================================================
// 验证文章详情页加载和内容渲染

import { test, expect } from "@playwright/test";

test.describe("文章详情页 (Post Detail)", () => {
  test("文章列表 API 应返回数据", async ({ request }) => {
    // 测试文章列表 API
    const response = await request.get("/api/backend/posts");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();

    // 验证响应结构
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("文章详情 API 应正常工作", async ({ request }) => {
    // 先获取文章列表
    const listResponse = await request.get("/api/backend/posts");
    const listJson = await listResponse.json();

    // 如果有文章，测试详情 API
    if (listJson.data && listJson.data.length > 0) {
      const firstPostId = listJson.data[0].id;
      const detailResponse = await request.get(`/api/backend/posts/${firstPostId}`);

      expect(detailResponse.ok()).toBeTruthy();

      const detailJson = await detailResponse.json();
      expect(detailJson).toHaveProperty("success", true);
      expect(detailJson).toHaveProperty("data");
      expect(detailJson.data).toHaveProperty("id", firstPostId);
      expect(detailJson.data).toHaveProperty("title");
      expect(detailJson.data).toHaveProperty("content");
    }
  });
});
