// ============================================================================
// E2E 测试工具库
// ============================================================================
// 提供共享的测试辅助函数，确保所有测试遵循统一的验证标准

import { Page, BrowserContext, expect } from "@playwright/test";

/**
 * 管理员登录并获取认证状态
 * 优化：先检查是否已登录，避免重复登录触发频率限制
 * @returns true 登录成功或已登录, false 触发频率限制或失败
 */
export async function loginAsAdmin(context: BrowserContext): Promise<boolean> {
  // 1. 先检查是否已有 token（已登录）
  const cookies = await context.cookies();
  const existingToken = cookies.find((c) => c.name === "token");
  if (existingToken) {
    return true; // 已登录，直接返回
  }

  // 2. 未登录，执行登录请求
  const loginResponse = await context.request.post("/api/auth/login", {
    data: {
      username: "chaofan",
      password: "chaofan0920",
    },
  });

  if (loginResponse.status() === 429) {
    return false; // 频率限制
  }

  if (loginResponse.ok()) {
    const newCookies = await context.cookies();
    const tokenCookie = newCookies.find((c) => c.name === "token");
    return !!tokenCookie;
  }
  return false;
}

/**
 * 通过后端 API 登录并返回 token
 * @returns token 字符串，或 null（失败/频率限制）
 */
export async function loginAndGetToken(
  request: BrowserContext["request"]
): Promise<string | null> {
  const loginResponse = await request.post("/api/backend/auth/login", {
    data: {
      username: "chaofan",
      password: "chaofan0920",
    },
  });

  if (loginResponse.status() === 429 || !loginResponse.ok()) {
    return null;
  }

  const json = await loginResponse.json();
  return json.token ?? null;
}

/**
 * 页面加载验证器
 * 检查页面是否成功加载，无 JS 错误，无错误页面
 */
export class PageValidator {
  private errors: string[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    // 监听页面 JS 错误
    page.on("pageerror", (err) => this.errors.push(err.message));
  }

  /**
   * 导航到页面并验证加载成功
   */
  async goto(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 断言：页面没有 JavaScript 错误
   */
  async expectNoErrors() {
    expect(
      this.errors,
      `页面存在 JS 错误: ${this.errors.join(", ")}`
    ).toHaveLength(0);
  }

  /**
   * 断言：不是 Next.js 错误页面
   */
  async expectNotErrorPage() {
    const content = await this.page.content();
    expect(content).not.toContain("Application error");
    expect(content).not.toContain("client-side exception");
    expect(content).not.toContain("Internal Server Error");
  }

  /**
   * 断言：页面标题包含指定文本
   */
  async expectTitleContains(text: string) {
    const heading = this.page.locator("h1, h2, [data-testid='page-title']").first();
    await expect(heading).toContainText(text);
  }

  /**
   * 断言：页面内容包含指定文本
   */
  async expectContentContains(text: string) {
    const content = await this.page.content();
    expect(content).toContain(text);
  }

  /**
   * 完整验证：无错误 + 非错误页面 + 标题包含文本
   */
  async expectPageLoaded(expectedTitle: string) {
    await this.expectNoErrors();
    await this.expectNotErrorPage();
    await this.expectTitleContains(expectedTitle);
  }
}

/**
 * API 响应验证器
 */
export function expectApiSuccess(json: unknown) {
  expect(json).toHaveProperty("success", true);
}

export function expectPaginatedResponse(json: unknown) {
  expect(json).toHaveProperty("success", true);
  expect(json).toHaveProperty("data");
  expect(json).toHaveProperty("meta");
  expect(Array.isArray((json as { data: unknown[] }).data)).toBeTruthy();
}

// ============================================================================
// 测试数据管理
// ============================================================================

/**
 * 测试数据前缀，用于标识 E2E 测试创建的数据
 * 便于后续清理：可搜索 "[E2E_AUTO]" 前缀的数据进行删除
 */
export const E2E_PREFIX = "[E2E_AUTO]";

/**
 * 生成带时间戳的测试数据名称
 * @example generateTestName("文章") => "[E2E_AUTO] 20260111_133101_文章"
 */
export function generateTestName(baseName: string): string {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
  return `${E2E_PREFIX} ${timestamp}_${baseName}`;
}

// ============================================================================
// 视觉测试辅助
// ============================================================================

/**
 * 获取常用的视觉遮罩定位器
 * 用于截图时遮盖变动区域（时间戳、会话 ID 等）
 */
export function getCommonMasks(page: Page) {
  return [
    page.locator('[data-testid="timestamp"]'),
    page.locator('[data-testid="session-id"]'),
    page.locator(".relative-time"),
    page.locator(".order-id"),
  ];
}

/**
 * 常用视口尺寸
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },   // iPhone SE
  tablet: { width: 768, height: 1024 },  // iPad
  desktop: { width: 1280, height: 800 }, // 标准桌面
} as const;

// ============================================================================
// 测试结果记录器 (用于"先记录，后分析"策略)
// ============================================================================

export interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  error?: string;
  duration?: number;
}

/**
 * 测试结果收集器
 * 支持先运行所有测试，最后统一分析失败原因
 */
export class TestResultRecorder {
  private results: TestResult[] = [];

  record(result: TestResult) {
    this.results.push(result);
  }

  getAll(): TestResult[] {
    return this.results;
  }

  getSummary() {
    const pass = this.results.filter((r) => r.status === "pass").length;
    const fail = this.results.filter((r) => r.status === "fail").length;
    const skip = this.results.filter((r) => r.status === "skip").length;
    return { total: this.results.length, pass, fail, skip };
  }

  getFailures(): TestResult[] {
    return this.results.filter((r) => r.status === "fail");
  }
}
