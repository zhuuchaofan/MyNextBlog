// ============================================================================
// E2E Test: 文章发布全流程 (Post Publishing Lifecycle)
// ============================================================================
// 每一步都截图的详细测试，用于生成完整的测试证据
// 截图保存在: test-results/screenshots/post-publishing/
//
// 测试流程:
//   Step 1: 访问管理后台
//   Step 2: 进入文章管理页面
//   Step 3: 通过 API 创建草稿文章
//   Step 4: 验证草稿在管理列表中
//   Step 5: 发布文章 (切换可见性)
//   Step 6: 验证前台可见
//   Step 7: 隐藏文章
//   Step 8: 验证前台不可见
//   Step 9: 删除文章 (移入回收站)
//   Step 10: 验证回收站
//   Step 11: 永久删除

import { test, expect, Page } from "@playwright/test";
import {
  loginAndGetToken,
  PageValidator,
  expectApiSuccess,
  E2E_PREFIX,
  generateTestName,
} from "./utils/test-helpers";
import * as fs from "fs";
import * as path from "path";

// 截图目录
const SCREENSHOT_DIR = "test-results/screenshots/post-publishing";

// 确保截图目录存在
function ensureScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

// 带步骤编号的截图函数
async function takeStepScreenshot(
  page: Page,
  step: number,
  name: string
): Promise<void> {
  ensureScreenshotDir();
  const filename = `step-${String(step).padStart(2, "0")}-${name}.png`;
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
  });
  console.log(`📸 [Step ${step}] 截图已保存: ${filename}`);
}

test.describe("文章发布全流程 (Post Publishing)", () => {
  // 串行执行
  test.describe.configure({ mode: "serial" });

  // 测试文章信息
  const testPostTitle = generateTestName("测试文章");
  let authToken: string | null = null;
  let createdPostId: number | null = null;

  // ========================================================================
  // Step 1: 访问管理后台
  // ========================================================================

  test("Step 1: 访问管理后台首页", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/admin");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();

    await takeStepScreenshot(page, 1, "admin-dashboard");
  });

  // ========================================================================
  // Step 2: 进入文章管理页面
  // ========================================================================

  test("Step 2: 进入文章管理页面", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/admin/posts");

    await validator.expectNoErrors();
    await validator.expectNotErrorPage();
    await validator.expectTitleContains("文章");

    await takeStepScreenshot(page, 2, "admin-posts-list");
  });

  // ========================================================================
  // Step 3: 创建草稿文章 (API)
  // ========================================================================

  test("Step 3: 创建草稿文章", async ({ request, page }) => {
    // 获取 token
    authToken = await loginAndGetToken(request);
    if (!authToken) {
      test.skip(true, "登录失败");
      return;
    }

    // 创建草稿文章
    const response = await request.post("/api/backend/posts", {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        title: testPostTitle,
        content: `# ${testPostTitle}\n\n这是一篇由 E2E 测试自动创建的文章。\n\n## 测试目的\n\n验证完整的文章发布流程。`,
        summary: "E2E 测试文章",
        isHidden: true, // 创建为草稿 (隐藏状态)
      },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expectApiSuccess(json);

    createdPostId = json.postId;
    expect(createdPostId).toBeTruthy();

    console.log(`📝 [Step 3] 草稿创建成功，ID: ${createdPostId}, 标题: ${testPostTitle}`);

    // 刷新页面并截图
    const validator = new PageValidator(page);
    await validator.goto("/admin/posts");
    await page.waitForLoadState("networkidle");

    await takeStepScreenshot(page, 3, "post-created-draft");
  });

  // ========================================================================
  // Step 4: 验证草稿在管理列表中
  // ========================================================================

  test("Step 4: 验证草稿在管理列表中", async ({ request, page }) => {
    if (!authToken || !createdPostId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // API 验证
    const response = await request.get(
      `/api/backend/posts/admin/${createdPostId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.data.title).toBe(testPostTitle);
    expect(json.data.isHidden).toBe(true); // 应该是隐藏状态

    console.log(`✅ [Step 4] 草稿验证成功: ${json.data.title} (isHidden: ${json.data.isHidden})`);

    // 截图 - 文章详情页
    const validator = new PageValidator(page);
    await validator.goto(`/admin/posts/${createdPostId}/edit`);
    await page.waitForLoadState("networkidle");

    await takeStepScreenshot(page, 4, "draft-detail-view");
  });

  // ========================================================================
  // Step 5: 发布文章 (切换可见性)
  // ========================================================================

  test("Step 5: 发布文章", async ({ request, page }) => {
    if (!authToken || !createdPostId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // 切换可见性 (发布)
    const response = await request.patch(
      `/api/backend/posts/${createdPostId}/visibility`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.isHidden).toBe(false); // 现在应该是公开状态

    console.log(`🚀 [Step 5] 文章已发布 (isHidden: ${json.isHidden})`);

    // 刷新管理页面截图
    const validator = new PageValidator(page);
    await validator.goto("/admin/posts");
    await page.waitForLoadState("networkidle");

    await takeStepScreenshot(page, 5, "post-published");
  });

  // ========================================================================
  // Step 6: 验证前台可见
  // ========================================================================

  test("Step 6: 验证前台可见", async ({ request, page }) => {
    if (!createdPostId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // API 验证 (公开接口)
    const response = await request.get(`/api/backend/posts/${createdPostId}`);
    expect(response.ok()).toBeTruthy();

    const json = await response.json();
    expect(json.data.title).toBe(testPostTitle);

    console.log(`🌐 [Step 6] 前台 API 可访问: ${json.data.title}`);

    // 前台页面截图
    const validator = new PageValidator(page);
    await validator.goto(`/posts/${createdPostId}`);
    await page.waitForLoadState("networkidle");

    await validator.expectNoErrors();

    await takeStepScreenshot(page, 6, "post-public-view");
  });

  // ========================================================================
  // Step 7: 隐藏文章
  // ========================================================================

  test("Step 7: 隐藏文章", async ({ request, page }) => {
    if (!authToken || !createdPostId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // 再次切换可见性 (隐藏)
    const response = await request.patch(
      `/api/backend/posts/${createdPostId}/visibility`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.isHidden).toBe(true); // 现在应该是隐藏状态

    console.log(`🙈 [Step 7] 文章已隐藏 (isHidden: ${json.isHidden})`);

    // 管理页面截图
    const validator = new PageValidator(page);
    await validator.goto("/admin/posts");
    await page.waitForLoadState("networkidle");

    await takeStepScreenshot(page, 7, "post-hidden");
  });

  // ========================================================================
  // Step 8: 验证前台不可见
  // ========================================================================

  test("Step 8: 验证前台不可见", async ({ request, page }) => {
    if (!createdPostId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // API 验证 (公开接口应返回 404)
    const response = await request.get(`/api/backend/posts/${createdPostId}`);
    expect(response.status()).toBe(404);

    console.log(`🚫 [Step 8] 前台 API 返回 404 (文章已隐藏)`);

    // 前台页面尝试访问 (应显示 404)
    await page.goto(`/posts/${createdPostId}`);
    await page.waitForLoadState("networkidle");

    await takeStepScreenshot(page, 8, "post-not-found");
  });

  // ========================================================================
  // Step 9: 删除文章 (移入回收站)
  // ========================================================================

  test("Step 9: 删除文章 (移入回收站)", async ({ request, page }) => {
    if (!authToken || !createdPostId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // 删除文章 (软删除)
    const response = await request.delete(
      `/api/backend/posts/${createdPostId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.ok()).toBeTruthy();

    console.log(`🗑️ [Step 9] 文章已移入回收站`);

    // 管理页面截图
    const validator = new PageValidator(page);
    await validator.goto("/admin/posts");
    await page.waitForLoadState("networkidle");

    await takeStepScreenshot(page, 9, "post-soft-deleted");
  });

  // ========================================================================
  // Step 10: 验证回收站
  // ========================================================================

  test("Step 10: 验证回收站", async ({ request, page }) => {
    if (!authToken || !createdPostId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // API 验证回收站
    const response = await request.get("/api/backend/posts/trash", {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();

    // 检查回收站包含我们的文章
    const deletedPost = json.data?.find(
      (p: { id: number }) => p.id === createdPostId
    );
    expect(deletedPost).toBeTruthy();

    console.log(`♻️ [Step 10] 回收站验证成功，文章 ID ${createdPostId} 在回收站中`);

    // 回收站页面截图
    const validator = new PageValidator(page);
    await validator.goto("/admin/trash");
    await page.waitForLoadState("networkidle");

    await takeStepScreenshot(page, 10, "trash-view");
  });

  // ========================================================================
  // Step 11: 永久删除
  // ========================================================================

  test("Step 11: 永久删除", async ({ request, page }) => {
    if (!authToken || !createdPostId) {
      test.skip(true, "缺少前置条件");
      return;
    }

    // 永久删除
    const response = await request.delete(
      `/api/backend/posts/${createdPostId}/permanent`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    expect(response.ok()).toBeTruthy();

    console.log(`💀 [Step 11] 文章已永久删除`);

    // 回收站页面截图 (确认已清空)
    const validator = new PageValidator(page);
    await validator.goto("/admin/trash");
    await page.waitForLoadState("networkidle");

    await takeStepScreenshot(page, 11, "trash-after-permanent-delete");

    // 最终总结
    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ 文章发布全流程测试完成！`);
    console.log(`   截图目录: ${SCREENSHOT_DIR}/`);
    console.log(`${"=".repeat(60)}\n`);
  });
});

// ============================================================================
// 异常流程测试 (Error Scenarios)
// ============================================================================

test.describe("文章发布异常流程", () => {
  // 注意: 这个 describe 不使用 storageState，以测试真正的未授权场景
  test.use({ storageState: { cookies: [], origins: [] } });

  const SCREENSHOT_DIR_ERROR = "test-results/screenshots/post-publishing-errors";

  function ensureErrorScreenshotDir() {
    if (!fs.existsSync(SCREENSHOT_DIR_ERROR)) {
      fs.mkdirSync(SCREENSHOT_DIR_ERROR, { recursive: true });
    }
  }

  async function takeErrorScreenshot(
    page: Page,
    name: string
  ): Promise<void> {
    ensureErrorScreenshotDir();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_ERROR, `${name}.png`),
      fullPage: true,
    });
    console.log(`📸 [异常] 截图已保存: ${name}.png`);
  }

  // ========================================================================
  // 权限验证
  // ========================================================================

  test("异常 1: 未登录用户无法创建文章", async ({ request, page }) => {
    const response = await request.post("/api/backend/posts", {
      data: {
        title: "未授权文章",
        content: "测试内容",
      },
    });

    expect(response.status()).toBe(401);
    console.log(`🚫 [异常 1] 未登录创建文章返回 401`);

    // 访问管理页面 (应跳转登录)
    await page.goto("/admin/posts");
    await page.waitForLoadState("networkidle");

    await takeErrorScreenshot(page, "error-01-unauthorized-access");
  });

  test("异常 2: 未登录用户无法删除文章", async ({ request }) => {
    const response = await request.delete("/api/backend/posts/1");
    // API 可能返回 401 (未授权) 或 404 (资源不存在)
    expect([401, 404]).toContain(response.status());

    console.log(`🚫 [异常 2] 未登录删除文章返回 ${response.status()}`);
  });

  test("异常 3: 未登录用户无法切换文章可见性", async ({ request }) => {
    const response = await request.patch("/api/backend/posts/1/visibility");
    // API 可能返回 401 (未授权) 或 404 (资源不存在)
    expect([401, 404]).toContain(response.status());

    console.log(`🚫 [异常 3] 未登录切换可见性返回 ${response.status()}`);
  });

  // ========================================================================
  // 无效数据
  // ========================================================================

  test("异常 4: 创建文章缺少标题", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录失败");
      return;
    }

    const response = await request.post("/api/backend/posts", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        // 缺少 title
        content: "只有内容没有标题",
      },
    });

    expect(response.ok()).toBeFalsy();
    console.log(`🚫 [异常 4] 缺少标题返回错误: ${response.status()}`);
  });

  test("异常 5: 创建文章缺少内容", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录失败");
      return;
    }

    const response = await request.post("/api/backend/posts", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: "只有标题没有内容",
        // 缺少 content
      },
    });

    expect(response.ok()).toBeFalsy();
    console.log(`🚫 [异常 5] 缺少内容返回错误: ${response.status()}`);
  });

  // ========================================================================
  // 资源不存在
  // ========================================================================

  test("异常 6: 访问不存在的文章详情", async ({ request, page }) => {
    const response = await request.get("/api/backend/posts/999999");
    expect(response.status()).toBe(404);

    console.log(`🚫 [异常 6] 不存在文章返回 404`);

    // 前台页面访问
    await page.goto("/posts/999999");
    await page.waitForLoadState("networkidle");

    await takeErrorScreenshot(page, "error-06-post-not-found");
  });

  test("异常 7: 删除不存在的文章", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录失败");
      return;
    }

    const response = await request.delete("/api/backend/posts/999999", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(404);
    console.log(`🚫 [异常 7] 删除不存在文章返回 404`);
  });

  test("异常 8: 切换不存在文章的可见性", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录失败");
      return;
    }

    const response = await request.patch("/api/backend/posts/999999/visibility", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(404);
    console.log(`🚫 [异常 8] 切换不存在文章可见性返回 404`);
  });

  // ========================================================================
  // 边界条件
  // ========================================================================

  test("异常 9: 空标题文章", async ({ request }) => {
    const token = await loginAndGetToken(request);
    if (!token) {
      test.skip(true, "登录失败");
      return;
    }

    const response = await request.post("/api/backend/posts", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: "", // 空标题
        content: "内容存在但标题为空",
      },
    });

    expect(response.ok()).toBeFalsy();
    console.log(`🚫 [异常 9] 空标题返回错误: ${response.status()}`);
  });

  test("异常 10: 非法 ID 格式", async ({ request, page }) => {
    // 字符串 ID
    const response = await request.get("/api/backend/posts/abc");
    expect(response.ok()).toBeFalsy();

    console.log(`🚫 [异常 10] 非法 ID 格式返回错误: ${response.status()}`);

    // 前台访问非法 ID
    await page.goto("/posts/invalid-id");
    await page.waitForLoadState("networkidle");

    await takeErrorScreenshot(page, "error-10-invalid-id");
  });

  // ========================================================================
  // UI 异常状态
  // ========================================================================

  test("异常 11: 空列表状态", async ({ page }) => {
    // 搜索不存在的内容，触发空列表
    const validator = new PageValidator(page);
    await validator.goto("/admin/posts?search=xxxxxxxxxnotexist");
    await page.waitForLoadState("networkidle");

    await validator.expectNoErrors();

    await takeErrorScreenshot(page, "error-11-empty-search-result");
    console.log(`📭 [异常 11] 空搜索结果页面截图完成`);
  });

  test("异常 12: 回收站空状态", async ({ page }) => {
    const validator = new PageValidator(page);
    await validator.goto("/admin/trash");
    await page.waitForLoadState("networkidle");

    await validator.expectNoErrors();

    await takeErrorScreenshot(page, "error-12-empty-trash");
    console.log(`📭 [异常 12] 空回收站页面截图完成`);
  });
});

