# E2E 测试规范

## 核心工具

### `tests/utils/test-helpers.ts`

提供以下工具：

| 工具                            | 用途                           |
| :------------------------------ | :----------------------------- |
| `loginAsAdmin(context)`         | 通过 BFF 登录，返回 boolean    |
| `loginAndGetToken(request)`     | 通过后端 API 登录，返回 token  |
| `PageValidator`                 | 页面验证器（详见下方）         |
| `expectApiSuccess(json)`        | 验证 `{ success: true }`       |
| `expectPaginatedResponse(json)` | 验证 `{ success, data, meta }` |

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
