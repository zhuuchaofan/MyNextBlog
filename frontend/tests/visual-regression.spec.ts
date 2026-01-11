// ============================================================================
// E2E Test: 视觉回归测试 (Visual Regression)
// ============================================================================
// 使用 Playwright 截图对比功能，验证关键页面的视觉一致性
// 首次运行: npx playwright test --update-snapshots

import { test, expect } from "@playwright/test";
import { loginAsAdmin, getCommonMasks } from "./utils/test-helpers";

test.describe("视觉回归测试 (Visual Regression)", () => {
  // ========================================================================
  // 公开页面 (无需登录)
  // ========================================================================

  test("首页视觉回归", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("home-page.png", {
      fullPage: true,
      mask: getCommonMasks(page),
    });
  });

  test("关于页面视觉回归", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("about-page.png", {
      fullPage: true,
      mask: getCommonMasks(page),
    });
  });

  test("友链页面视觉回归", async ({ page }) => {
    await page.goto("/friends");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("friends-page.png", {
      fullPage: true,
      mask: getCommonMasks(page),
    });
  });

  test("登录页面视觉回归", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("login-page.png", {
      fullPage: true,
    });
  });

  // ========================================================================
  // 管理后台 (串行执行，共享登录状态)
  // ========================================================================

  test.describe("管理后台视觉回归", () => {
    // 串行执行：第一个测试登录后，后续测试复用同一个 context
    test.describe.configure({ mode: "serial" });

    test("管理员仪表盘视觉回归", async ({ page, context }) => {
      // 这是串行执行中的第一个测试，执行登录
      const loggedIn = await loginAsAdmin(context);
      if (!loggedIn) {
        test.skip(true, "无法登录");
        return;
      }

      await page.goto("/admin");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("admin-dashboard.png", {
        fullPage: true,
        mask: getCommonMasks(page),
      });
    });

    test("文章管理页面视觉回归", async ({ page, context }) => {
      // 串行模式下，context 复用上一个测试的登录状态
      // 但 Playwright 默认每个测试有独立 context，所以仍需检查
      const loggedIn = await loginAsAdmin(context);
      if (!loggedIn) {
        test.skip(true, "无法登录");
        return;
      }

      await page.goto("/admin/posts");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("admin-posts.png", {
        fullPage: true,
        mask: getCommonMasks(page),
      });
    });

    test("评论管理页面视觉回归", async ({ page, context }) => {
      const loggedIn = await loginAsAdmin(context);
      if (!loggedIn) {
        test.skip(true, "无法登录");
        return;
      }

      await page.goto("/admin/comments");
      await page.waitForLoadState("networkidle");

      await expect(page).toHaveScreenshot("admin-comments.png", {
        fullPage: true,
        mask: getCommonMasks(page),
      });
    });
  });
});

