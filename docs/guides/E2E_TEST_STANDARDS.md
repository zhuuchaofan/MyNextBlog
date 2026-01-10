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
