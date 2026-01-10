// ============================================================================
// E2E Test: 搜索功能
// ============================================================================
// 验证文章搜索功能

import { test, expect } from "@playwright/test";

test.describe("搜索功能 (Search)", () => {
  test("搜索 API 应返回结果", async ({ request }) => {
    // 使用通用关键词搜索
    const response = await request.get("/api/backend/posts?search=a");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  test("空搜索应返回所有文章", async ({ request }) => {
    const response = await request.get("/api/backend/posts?search=");

    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("data");
  });

  test("分页应正常工作", async ({ request }) => {
    // 测试第一页
    const page1Response = await request.get("/api/backend/posts?page=1&pageSize=5");
    expect(page1Response.ok()).toBeTruthy();

    const page1Json = await page1Response.json();
    expect(page1Json).toHaveProperty("success", true);
    expect(page1Json).toHaveProperty("meta");
    expect(page1Json.meta).toHaveProperty("page", 1);
    expect(page1Json.meta).toHaveProperty("pageSize", 5);
  });
});
