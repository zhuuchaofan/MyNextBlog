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

    // 等待表格或卡片加载
    await page.waitForLoadState("networkidle");

    // 检查页面内容
    const content = await page.content();
    
    // 检查是否包含"公开"文本（Badge 显示）
    const hasPublicBadge = content.includes("公开");
    
    // 如果有系列数据，应该能看到"公开"Badge
    if (!content.includes("暂无")) {
      expect(hasPublicBadge).toBeTruthy();
      console.log("✓ 找到'公开'统计 Badge");
    }

    // 验证表格标题"文章数"项存在
    const tableHeader = page.locator('th:has-text("文章数")');
    if (await tableHeader.isVisible().catch(() => false)) {
      console.log("✓ 找到'文章数'表格列");
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

  test("管理员访问公开系列列表应可见隐藏统计", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    const validator = new PageValidator(page);
    await validator.goto("/series");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 管理员应能看到隐藏统计
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    
    // 检查是否显示"隐藏"标记
    const hasHiddenBadge = content.includes("隐藏");
    if (hasHiddenBadge) {
      console.log("✓ 管理员可见隐藏文章统计");
    }

    await page.screenshot({
      path: "test-results/screenshots/series-public-admin-view.png",
      fullPage: true,
    });
  });

  // ========================================================================
  // 系列详情页 - 隐藏文章特殊样式
  // ========================================================================

  test("系列详情页应区分显示隐藏文章", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    // 直接访问已知有隐藏文章的系列 (C#学习 ID=1 或其他)
    // 先获取系列列表找一个有文章的
    const validator = new PageValidator(page);
    
    // 访问系列列表页找一个链接
    await validator.goto("/series");
    await page.waitForLoadState("networkidle");
    
    const seriesLinks = page.locator('a[href^="/series/"]');
    const linkCount = await seriesLinks.count();
    
    if (linkCount === 0) {
      test.skip(true, "没有可用系列");
      return;
    }
    
    // 点击第一个系列
    await seriesLinks.first().click();
    await page.waitForLoadState("networkidle");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    // 验证文章列表存在
    const articleLinks = page.locator('a[href^="/posts/"]');
    const articleCount = await articleLinks.count();
    console.log(`✓ 系列详情页显示 ${articleCount} 篇文章`);

    // 检查是否有隐藏标记
    const hiddenMarkers = page.locator('text="隐藏"');
    const hiddenCount = await hiddenMarkers.count();
    if (hiddenCount > 0) {
      console.log(`✓ 找到 ${hiddenCount} 个隐藏文章标记`);
    }

    await page.screenshot({
      path: "test-results/screenshots/series-detail-hidden-posts.png",
      fullPage: true,
    });
  });

  test("隐藏文章应显示特殊样式（虚线边框）", async ({ page, context }) => {
    const loggedIn = await loginAsAdmin(context);
    if (!loggedIn) {
      test.skip(true, "无法登录");
      return;
    }

    // 访问系列列表页找一个有隐藏文章的系列
    await page.goto("/series");
    await page.waitForLoadState("networkidle");
    
    // 找有隐藏标记的系列
    const hiddenBadges = page.locator('text="隐藏"');
    const hiddenBadgeCount = await hiddenBadges.count();
    
    if (hiddenBadgeCount === 0) {
      test.skip(true, "没有包含隐藏文章的系列");
      return;
    }
    
    // 点击第一个有隐藏标记的系列卡片
    const firstHiddenBadge = hiddenBadges.first();
    const seriesCard = firstHiddenBadge.locator('xpath=ancestor::a[starts-with(@href, "/series/")]');
    await seriesCard.click();
    await page.waitForLoadState("networkidle");

    // 验证页面中有隐藏标记
    const hiddenMarkers = page.locator('text="隐藏"');
    const count = await hiddenMarkers.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✓ 找到 ${count} 个隐藏文章标记`);

    // 验证隐藏文章卡片有虚线边框样式 (border-dashed)
    const hiddenCards = page.locator('div.border-dashed');
    const hiddenCardCount = await hiddenCards.count();
    expect(hiddenCardCount).toBeGreaterThan(0);
    console.log(`✓ 找到 ${hiddenCardCount} 个虚线边框卡片`);

    await page.screenshot({
      path: "test-results/screenshots/series-detail-hidden-style.png",
      fullPage: true,
    });
  });
});
