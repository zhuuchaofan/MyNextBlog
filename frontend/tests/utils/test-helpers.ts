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
