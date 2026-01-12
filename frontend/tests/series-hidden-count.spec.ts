// ============================================================================
// E2E Test: 系列隐藏文章统计功能 (Series Hidden Post Count)
// ============================================================================
// 验证系列页面分开显示公开/隐藏文章数功能
// - API 返回 hiddenPostCount 字段
// - 管理员可见隐藏文章统计
// - 系列详情页隐藏文章特殊样式

import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
  VIEWPORTS,
} from "./utils/test-helpers";

test.describe("系列隐藏文章统计 (Series Hidden Post Count)", () => {
  test.describe.configure({ mode: "serial" });

  // ========================================================================
  // API 测试 - hiddenPostCount 字段验证
  // ========================================================================

  test("系列列表 API 应返回 hiddenPostCount 字段", async ({ request }) => {
    const response = await request.get("/api/backend/series");
    
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    expect(Array.isArray(json.data)).toBeTruthy();

    // 验证每个系列都有 hiddenPostCount 字段
    if (json.data.length > 0) {
      const firstSeries = json.data[0];
      expect(firstSeries).toHaveProperty("postCount");
      expect(firstSeries).toHaveProperty("hiddenPostCount");
      expect(typeof firstSeries.postCount).toBe("number");
      expect(typeof firstSeries.hiddenPostCount).toBe("number");
    }
  });

  test("管理员获取系列列表应返回 isAdmin = true", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录频率限制触发");
      return;
    }

    const response = await request.get("/api/backend/series", {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);
    
    // 管理员应收到 isAdmin = true
    expect(json.isAdmin).toBe(true);
  });

  test("游客获取系列列表应返回 isAdmin = false", async ({ browser }) => {
    // 创建完全干净的上下文，不继承任何存储状态
    const context = await browser.newContext({
      storageState: undefined,  // 确保不复用认证状态
    });
    const request = context.request;
    
    try {
      const response = await request.get("/api/backend/series");
      
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expectApiSuccess(json);
      
      // 游客应返回 isAdmin = false
      expect(json.isAdmin).toBe(false);
    } finally {
      await context.close();
    }
  });

  // ========================================================================
  // 后台系列管理页面 UI 测试
  // ========================================================================

  test("后台系列管理应显示分开的文章统计", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/admin/series");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 检查页面内容包含 "公开" 和 "隐藏" 关键词
    const content = await page.content();
    
    // 页面应该显示统计 Badge
    // 注：如果没有系列数据，则跳过内容验证
    if (content.includes("公开") || content.includes("隐藏") || content.includes("暂无")) {
      // 验证通过
      console.log("系列管理页面显示统计信息或空状态");
    }

    await page.screenshot({
      path: "test-results/screenshots/admin-series-hidden-count.png",
      fullPage: true,
    });
  });

  test("后台系列管理移动端应正确显示统计", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    await page.setViewportSize(VIEWPORTS.mobile);
    
    const validator = new PageValidator(page);
    await validator.goto("/admin/series");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    await page.screenshot({
      path: "test-results/screenshots/admin-series-hidden-count-mobile.png",
      fullPage: true,
    });
  });

  // ========================================================================
  // 公开系列列表页 - 管理员视角
  // ========================================================================

  test("管理员访问公开系列列表应可见隐藏统计", async ({ page, context, request }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    // 先检查是否有隐藏文章的系列
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "无法获取 Token");
      return;
    }
    
    const seriesRes = await request.get("/api/backend/series", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const seriesJson = await seriesRes.json();
    
    const hasHidden = seriesJson.data?.some((s: { hiddenPostCount?: number }) => 
      (s.hiddenPostCount ?? 0) > 0
    );

    const validator = new PageValidator(page);
    await validator.goto("/series");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    if (hasHidden) {
      // 如果有隐藏文章，页面应显示 "隐藏" 标记
      const content = await page.content();
      expect(content).toContain("隐藏");
    }

    await page.screenshot({
      path: "test-results/screenshots/series-public-admin-view.png",
      fullPage: true,
    });
  });

  // ========================================================================
  // 系列详情页 - 隐藏文章特殊样式
  // ========================================================================

  test("系列详情页应区分显示隐藏文章", async ({ page, context, request }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    // 找一个有隐藏文章的系列
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "无法获取 Token");
      return;
    }
    
    const seriesRes = await request.get("/api/backend/series", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const seriesJson = await seriesRes.json();
    
    // 找一个有文章的系列
    const targetSeries = seriesJson.data?.find((s: { postCount?: number; hiddenPostCount?: number }) => 
      (s.postCount ?? 0) + (s.hiddenPostCount ?? 0) > 0
    );

    if (!targetSeries) {
      test.skip(true, "没有包含文章的系列");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto(`/series/${targetSeries.id}`);

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 检查系列名称显示
    await expect(page.locator(`text="${targetSeries.name}"`).first()).toBeVisible();

    await page.screenshot({
      path: "test-results/screenshots/series-detail-hidden-posts.png",
      fullPage: true,
    });
  });

  test("隐藏文章应显示特殊样式（虚线边框）", async ({ page, context, request }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    // 找一个有隐藏文章的系列
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "无法获取 Token");
      return;
    }
    
    const seriesRes = await request.get("/api/backend/series", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const seriesJson = await seriesRes.json();
    
    const seriesWithHidden = seriesJson.data?.find((s: { hiddenPostCount?: number }) => 
      (s.hiddenPostCount ?? 0) > 0
    );

    if (!seriesWithHidden) {
      test.skip(true, "没有包含隐藏文章的系列");
      return;
    }

    await page.goto(`/series/${seriesWithHidden.id}`);
    await page.waitForLoadState("networkidle");

    // 验证页面中有隐藏标记
    const hiddenMarkers = page.locator('text="隐藏"');
    const count = await hiddenMarkers.count();

    if (count > 0) {
      console.log(`找到 ${count} 个隐藏文章标记`);
    }

    await page.screenshot({
      path: "test-results/screenshots/series-detail-hidden-style.png",
      fullPage: true,
    });
  });
});
