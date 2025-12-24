# 架构审计报告 (Architectural Audit Report)

> **审计时间**: 2024-12-24  
> **审计范围**: 完整 BFF 架构安全性与代码质量

---

## 🧐 审计发现汇总

| 严重程度     | 类别         | 位置                                       | 问题描述                                                                                                                                                                                             |
| :----------- | :----------- | :----------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🟡 **Major** | Security     | `AuthController.cs` & `frontend/app/api/*` | 混合型 BFF 模式风险：后端 API 直接返回 JWT Token 在响应体中。虽然 Next.js 中间层目前负责将其转换为 Cookie，但后端 API 本身缺乏对 "仅允许 Cookie" 的强制性，容易导致开发者绕过 BFF 直接在客户端使用。 |
| 🟡 **Major** | Security     | `frontend/middleware.ts`                   | 脆弱的 Token 解析：中间件通过 `token.split('.')[1]` 手动解析 JWT 检查过期时间，未校验签名。若 Token 格式非预期，可能导致中间件崩溃或逻辑绕过。                                                       |
| 🟢 **Minor** | Architecture | `frontend/components/PostInteraction*`     | LocalStorage 使用：使用 LocalStorage 存储 `liked_posts`。虽然不违反 "No Token in LocalStorage" 原则，但对于服务端渲染 (SSR) 可能会导致 "Hydration Mismatch"。                                        |
| 🟢 **Minor** | Style        | `GlobalExceptionMiddleware.cs`             | 需要确认是否屏蔽了生产环境的详细堆栈信息 (Stack Trace)。                                                                                                                                             |

---

## 🔍 深度分析

### 1. BFF 模式的"最后一公里"问题

目前的架构是 "Next.js 作为 BFF 层" 的典型实现：

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Browser/Client │ ──── │  Next.js (BFF)  │ ──── │  .NET Backend   │
│  (不应接触Token)  │      │  (Token 管理者)   │      │  (裸露返回Token) │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                       ↑
                                                  风险点：可被直接调用
```

- **符合点**：客户端 JS 确实无法获取 Token，符合 `GEMINI.md` 的核心安全要求。
- **风险点**：后端 API 是"无状态且盲目"的。如果有人直接调用 .NET 接口（例如移动端 App 或恶意脚本），他们仍然能拿到 Raw Token。

**建议方案**：

| 方案                                         | 复杂度 |    效果    |
| :------------------------------------------- | :----: | :--------: |
| ① **CORS 白名单** (仅允许 Next.js 服务端 IP) |   低   |   ⭐⭐⭐   |
| ② **内部网络隔离** (后端不暴露公网)          |   中   | ⭐⭐⭐⭐⭐ |
| ③ **API Gateway + mTLS** (双向证书认证)      |   高   | ⭐⭐⭐⭐⭐ |

### 2. 中间件的脆弱性

`frontend/middleware.ts` 承担了极其复杂的职责：

- 只有它在管理 Token 刷新（Thundering Herd 问题的高发区）。
- 它手动解析 Base64 字符串来判断过期。

这在生产环境中是危险的。如果 Token 结构变更，中间件会直接挂掉，导致全站 500。

**推荐修复**: 使用 `jose` 库进行安全的 Token 解析和签名验证。

```typescript
// 建议在 frontend/lib/auth.ts 中封装统一的 Token 解析逻辑
import { jwtVerify } from "jose";

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return payload;
  } catch (error) {
    return null; // Token 无效或过期
  }
}
```

---

## 📋 待办事项 (Action Items)

### 🔴 高优先级

- [ ] **P1**: 审查 `GlobalExceptionMiddleware.cs` 确认生产环境堆栈信息屏蔽
- [ ] **P1**: 重构 `middleware.ts` 的 Token 解析逻辑，使用 `jose` 库
- [ ] **P2**: 加固 CORS 配置，限制后端 API 的可访问性

### 🟡 中优先级 (功能增强)

- [ ] **P3**: 为 `Post` 模型添加 `UpdatedAt` 字段（修改时间）
  - 目前只有 `CreateTime`，缺少最后修改时间
  - SEO 需要（sitemap `<lastmod>`）
  - 用户体验需要（判断内容时效性）
  - 代码中已有注释占位：`// public DateTime？ FinalEditTime { get; set; }`

### 🟢 低优先级

- [ ] **P4**: 解决 Hydration Mismatch（`liked_posts` 使用 LocalStorage）

---

## 📅 审计日志

| 日期       | 操作         | 备注                 |
| :--------- | :----------- | :------------------- |
| 2024-12-24 | 初始审计报告 | 完成安全性与架构审查 |
