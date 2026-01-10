# E2E 测试规范

## 核心工具

### `tests/utils/test-helpers.ts`

提供以下工具：

| 工具                            | 用途                                          |
| :------------------------------ | :-------------------------------------------- |
| `loginAsAdmin(context)`         | 通过 BFF 登录，自动检测已登录状态避免重复登录 |
| `loginAndGetToken(request)`     | 通过后端 API 登录，返回 token                 |
| `PageValidator`                 | 页面验证器（详见下方）                        |
| `expectApiSuccess(json)`        | 验证 `{ success: true }`                      |
| `expectPaginatedResponse(json)` | 验证 `{ success, data, meta }`                |

### PageValidator 使用

```typescript
const validator = new PageValidator(page);
await validator.goto("/admin/comments");

// 必须调用的断言
await validator.expectNoErrors(); // 无 JS 错误
await validator.expectNotErrorPage(); // 非错误页面
await validator.expectTitleContains("评论"); // 标题正确
```

## 测试编写规范

### 1. 始终检测客户端错误

```typescript
// ❌ 错误: 只检查内容
const content = await page.content();
expect(content).toContain("评论");

// ✅ 正确: 使用 PageValidator
const validator = new PageValidator(page);
await validator.goto("/admin/comments");
await validator.expectNoErrors();
await validator.expectNotErrorPage();
await validator.expectTitleContains("评论");
```

### 2. API 响应验证

```typescript
// ❌ 错误: 手动检查
expect(json.success).toBe(true);
expect(json.data).toBeDefined();

// ✅ 正确: 使用辅助函数
expectPaginatedResponse(json); // 分页响应
expectApiSuccess(json); // 简单响应
```

### 3. 登录处理

```typescript
// ✅ 处理频率限制
const token = await loginAndGetToken(request);
if (!token) {
  test.skip(true, "登录频率限制触发");
  return;
}
```

> **优化 (2026-01)**: `loginAsAdmin` 现在会先检查 cookie 中是否已有 token，
> 如果已登录则跳过登录请求，避免触发频率限制。

### 4. 截图验证 ✨ (2026-01 新增)

使用 Playwright 截图功能进行视觉验证：

```typescript
// 保存整页截图
await page.screenshot({
  path: "test-results/screenshots/admin-comments-page.png",
  fullPage: true,
});

// 验证元素存在并检查属性
const avatarImages = page.locator('img[class*="avatar"]');
const count = await avatarImages.count();

if (count > 0) {
  for (let i = 0; i < Math.min(count, 5); i++) {
    const src = await avatarImages.nth(i).getAttribute("src");
    expect(src).toBeTruthy();
    expect(src).toMatch(/^https?:\/\//);
  }
}
```

**截图输出目录**: `frontend/test-results/screenshots/`

**使用场景**:

- UI 回归测试（对比截图差异）
- 调试页面渲染问题
- 验证动态内容正确显示（如头像、图片）

### 5. 页面布局检测

检测元素位置、尺寸和 CSS 样式：

```typescript
// 获取元素边界框 (位置和尺寸)
const element = page.locator(".comment-card");
const box = await element.boundingBox();
expect(box?.width).toBeGreaterThan(100);
expect(box?.height).toBeGreaterThan(50);

// 检测 CSS 样式
const display = await element.evaluate(
  (el) => window.getComputedStyle(el).display
);
expect(display).toBe("flex");

// 检测元素是否在视口内
await expect(element).toBeInViewport();
```

### 6. 数据一致性验证

对比 API 响应与页面显示的数据，确保一致性：

```typescript
// 1. 获取 API 数据
const apiRes = await request.get("/api/backend/comments/admin", {
  headers: { Authorization: `Bearer ${token}` },
});
const apiData = await apiRes.json();

// 2. 获取页面显示的数据条数
const pageRows = await page.locator("tbody tr").count();

// 3. 验证数据条数一致
expect(pageRows).toBe(apiData.data.length);

// 4. 验证具体内容 (可选)
if (apiData.data.length > 0) {
  const firstComment = apiData.data[0];
  const pageContent = await page.locator("tbody tr").first().textContent();
  expect(pageContent).toContain(firstComment.content.substring(0, 20));
}
```

### 7. 响应式布局测试

模拟不同设备视口验证响应式布局：

```typescript
// 定义常用视口
const viewports = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  tablet: { width: 768, height: 1024 }, // iPad
  desktop: { width: 1280, height: 800 }, // 标准桌面
};

// 移动端测试
test("移动端布局正确", async ({ page }) => {
  await page.setViewportSize(viewports.mobile);
  await page.goto("/admin/comments");

  // 移动端应隐藏桌面表格
  await expect(page.locator(".hidden.md\\:block")).not.toBeVisible();
  // 移动端应显示卡片布局
  await expect(page.locator(".md\\:hidden")).toBeVisible();
});

// 桌面端测试
test("桌面端布局正确", async ({ page }) => {
  await page.setViewportSize(viewports.desktop);
  await page.goto("/admin/comments");

  // 桌面端应显示表格
  await expect(page.locator("table")).toBeVisible();
});
```

### 8. 视觉回归测试

使用 Playwright 内置截图对比功能：

```typescript
// 基准截图对比 (首次运行生成基准)
await expect(page).toHaveScreenshot("admin-comments-baseline.png", {
  fullPage: true,
  maxDiffPixelRatio: 0.01, // 允许 1% 像素差异
});

// 元素级截图对比
const header = page.locator("header");
await expect(header).toHaveScreenshot("header-baseline.png");
```

**初次运行**: `npx playwright test --update-snapshots` 生成基准截图

**CI 环境**: 对比截图差异，超过阈值则测试失败

---

## 测试分层策略

| 层级     | 测试类型 | 工具                     | 关注点                     |
| -------- | -------- | ------------------------ | -------------------------- |
| **API**  | 接口测试 | `request`                | 响应格式、状态码、数据结构 |
| **UI**   | 页面渲染 | `page` + `PageValidator` | JS 错误、元素可见性        |
| **视觉** | 截图对比 | `toHaveScreenshot`       | 布局变化、样式回归         |
| **数据** | 一致性   | API + DOM                | 前后端数据同步             |
