// ============================================================================
// E2E Test: 分类和标签
// ============================================================================
// 验证分类和标签 API 功能

import { test, expect } from "@playwright/test";

test.describe("分类和标签 (Categories & Tags)", () => {
  test("分类列表 API 应返回数据", async ({ request }) => {
    const response = await request.get("/api/backend/categories");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();

    // 验证分类结构
    if (json.data.length > 0) {
      expect(json.data[0]).toHaveProperty("id");
      expect(json.data[0]).toHaveProperty("name");
    }
  });

  test("热门标签 API 应返回数据", async ({ request }) => {
    const response = await request.get("/api/backend/tags/popular?count=10");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("按分类筛选文章应正常工作", async ({ request }) => {
    // 先获取分类列表
    const categoriesResponse = await request.get("/api/backend/categories");
    const categoriesJson = await categoriesResponse.json();

    if (categoriesJson.data && categoriesJson.data.length > 0) {
      const categoryId = categoriesJson.data[0].id;

      // 按分类筛选文章
      const postsResponse = await request.get(
        `/api/backend/posts?categoryId=${categoryId}`
      );

      expect(postsResponse.ok()).toBeTruthy();

      const postsJson = await postsResponse.json();
      expect(postsJson).toHaveProperty("success", true);
      expect(postsJson).toHaveProperty("data");
    }
  });
});
