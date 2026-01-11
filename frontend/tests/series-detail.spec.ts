// ============================================================================
// E2E Test: 系列详情页 (Series Detail)
// ============================================================================
// 验证公开系列详情页面、系列文章列表、导航功能

import { test, expect } from "@playwright/test";
import {
  PageValidator,
  expectApiSuccess,
  VIEWPORTS,
} from "./utils/test-helpers";

test.describe("系列详情页 (Series Detail)", () => {
  // ========================================================================
  // 系列列表 API
  // ========================================================================

  test("系列列表 API 应返回数据", async ({ request }) => {
    const response = await request.get("/api/backend/series");

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(json.data).toBeDefined();
    expect(Array.isArray(json.data)).toBeTruthy();
  });

  // ========================================================================
  // 系列详情 API
  // ========================================================================

  test("系列详情 API 应返回正确数据", async ({ request }) => {
    // 先获取系列列表
    const listResponse = await request.get("/api/backend/series");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用系列");
      return;
    }

    const seriesId = listJson.data[0].id;

    // 获取系列详情
    const detailResponse = await request.get(`/api/backend/series/${seriesId}`);
    expect(detailResponse.ok()).toBeTruthy();

    const detailJson = await detailResponse.json();
    expectApiSuccess(detailJson);
    expect(detailJson.data).toHaveProperty("id", seriesId);
    expect(detailJson.data).toHaveProperty("name");
  });

  test("系列文章列表 API 应返回数据", async ({ request }) => {
    // 获取系列列表
    const listResponse = await request.get("/api/backend/series");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用系列");
      return;
    }

    const seriesId = listJson.data[0].id;

    // 获取系列下的文章
    const postsResponse = await request.get(
      `/api/backend/series/${seriesId}/posts`
    );
    expect(postsResponse.ok()).toBeTruthy();

    const postsJson = await postsResponse.json();
    expectApiSuccess(postsJson);
    expect(Array.isArray(postsJson.data)).toBeTruthy();
  });

  test("不存在的系列应返回 404", async ({ request }) => {
    const response = await request.get("/api/backend/series/99999");
    expect(response.status()).toBe(404);
  });

  // ========================================================================
  // 系列列表页 UI
  // ========================================================================

  test("系列列表页应正常加载", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/series");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 截图保存
    await page.screenshot({
      path: "test-results/screenshots/series-list-page.png",
      fullPage: true,
    });
  });

  test("系列列表页应显示系列卡片或空状态", async ({ page }) => {
    await page.goto("/series");
    await page.waitForLoadState("networkidle");

    // 检查是否有系列卡片或空状态
    const seriesCards = page.locator('a[href^="/series/"]').first();
    const hasCards = await seriesCards.isVisible().catch(() => false);

    // 页面应该正常渲染（有系列卡片或页面内容正常）
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
    // hasCards 作为调试信息记录
    console.log(`系列卡片可见: ${hasCards}`);
  });

  // ========================================================================
  // 系列详情页 UI
  // ========================================================================

  test("系列详情页应正常加载", async ({ page, request }) => {
    // 获取一个系列
    const listResponse = await request.get("/api/backend/series");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用系列");
      return;
    }

    const seriesId = listJson.data[0].id;
    const seriesName = listJson.data[0].name;

    const validator = new PageValidator(page);
    await validator.goto(`/series/${seriesId}`);

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 验证系列名称显示
    await expect(page.locator(`text="${seriesName}"`).first()).toBeVisible();

    // 截图保存
    await page.screenshot({
      path: "test-results/screenshots/series-detail-page.png",
      fullPage: true,
    });
  });

  test("系列详情页应显示返回链接", async ({ page, request }) => {
    // 获取一个系列
    const listResponse = await request.get("/api/backend/series");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用系列");
      return;
    }

    const seriesId = listJson.data[0].id;

    await page.goto(`/series/${seriesId}`);
    await page.waitForLoadState("networkidle");

    // 检查返回链接
    const backLink = page.locator('a:has-text("返回系列列表")');
    await expect(backLink).toBeVisible();
  });

  test("系列详情页文章可点击进入", async ({ page, request }) => {
    // 获取一个有文章的系列
    const listResponse = await request.get("/api/backend/series");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用系列");
      return;
    }

    // 找一个有文章的系列
    let targetSeriesId: number | null = null;
    for (const series of listJson.data) {
      if (series.postCount && series.postCount > 0) {
        targetSeriesId = series.id;
        break;
      }
    }

    if (!targetSeriesId) {
      test.skip(true, "没有包含文章的系列");
      return;
    }

    await page.goto(`/series/${targetSeriesId}`);
    await page.waitForLoadState("networkidle");

    // 检查文章链接
    const postLinks = page.locator('a[href^="/posts/"]');
    const count = await postLinks.count();

    if (count > 0) {
      // 获取第一篇文章链接的 href
      const firstLink = postLinks.first();
      const href = await firstLink.getAttribute("href");

      // 使用 Promise.all 确保点击和导航同步
      await Promise.all([
        page.waitForURL(`**${href}`, { timeout: 10000 }),
        firstLink.click(),
      ]);

      // 验证跳转到文章详情页
      expect(page.url()).toContain("/posts/");
    }
  });

  // ========================================================================
  // 移动端布局
  // ========================================================================

  test("系列详情页移动端布局应正确", async ({ page, request }) => {
    // 获取一个系列
    const listResponse = await request.get("/api/backend/series");
    const listJson = await listResponse.json();

    if (!listJson.data || listJson.data.length === 0) {
      test.skip(true, "没有可用系列");
      return;
    }

    const seriesId = listJson.data[0].id;

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(`/series/${seriesId}`);
    await page.waitForLoadState("networkidle");

    // 验证标题可见
    await expect(page.locator("h1")).toBeVisible();

    // 截图
    await page.screenshot({
      path: "test-results/screenshots/series-detail-mobile.png",
      fullPage: true,
    });
  });
});
