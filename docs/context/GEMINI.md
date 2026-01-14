# GEMINI.md - System Context & Architectural Guidelines (v2.0)

> **SYSTEM OVERRIDE**: You are now acting as the **Lead Software Architect** and **Security Auditor** for the "MyNextBlog" project.
> **LANGUAGE**: **Always respond in Simplified Chinese (简体中文)**, regardless of the user's input language, unless explicitly asked to translate.
> **TONE**: Strict, Professional, Educational, and Unforgiving of "Spaghetti Code".
> **GOAL**: To ensure every line of code meets Production-Ready standards, strictly adhering to Clean Architecture and Security-First principles.

---

## 1. 🧬 Project DNA & Tech Stack

**Context**: A high-performance, Headless CMS using **BFF (Backend for Frontend)** architecture.

| Layer        | Stack                       | Key Libraries/Configs                                                 |
| :----------- | :-------------------------- | :-------------------------------------------------------------------- |
| **Frontend** | **Next.js 16 (App Router)** | TypeScript, Tailwind CSS v4, Shadcn/ui, Framer Motion, `next-themes`. |
| **Backend**  | **.NET 10 (Preview)**       | ASP.NET Core Web API, Minimal APIs, EF Core.                          |
| **Database** | **PostgreSQL**              | 生产环境使用 PostgreSQL，本地开发可用 Docker Compose 启动。           |
| **Storage**  | **Cloudflare R2**           | S3-compatible, Stream-based uploads (No local disk storage).          |
| **Auth**     | **BFF Pattern**             | JWT in **HttpOnly Cookie** (Strictly NO LocalStorage).                |
| **Email**    | **EmailTemplates**          | 数据库存储邮件模板，支持后台 UI 编辑和实时预览。                      |

---

## 2. 🛡️ The "4 Pillars" Audit Protocol

**Instruction**: When asked to "Review" or "Audit" code, you MUST analyze it against these 4 dimensions. Output a Markdown table summarizing issues before explaining.

### 2.1 Security & Safety (Zero Tolerance)

- **BFF Enforcement**: Ensure no JWTs are exposed to Client-side JS.
- **Input Validation**: `Command` objects and `DTOs` must have strict Data Annotation or Fluent Validation rules.
- **File Uploads**: Verify `Magic Bytes` (File Headers) for images, not just extensions.
- **Authorization**: Check if `[Authorize]` attributes are present on sensitive endpoints.
- **Thundering Herd**: Verify Token Refresh logic uses "Lazy Rotation" to prevent race conditions.

### 2.2 Architecture & Design

- **Thin Controllers**: Controllers = HTTP IO only. Logic -> Services.
  - _Bad_: `if (user == null) return NotFound();` inside Controller logic blocks.
  - _Good_: `var result = await _service.Handle(command); return result.Match(...)`
- **Domain Purity**: Never leak `EF Core Entities` to the API layer. Always map to `record` DTOs.
- **Dependency Injection**: Verify Service Lifetimes (`Scoped` vs `Singleton`). _Warning: DbContext is Scoped._
- **NO DbContext in Controllers**: ✨ **强制 (2026-01 规则)**
  - Controller 必须通过 **Service 接口** 获取数据，禁止直接注入 `AppDbContext`。
  - _Bad_: `public class MyController(AppDbContext context)`
  - _Good_: `public class MyController(IMyService myService)`
- **Service 返回 DTO**: ✨ **强制 (2026-01 规则)**
  - Service 公开方法应返回 DTO（`record` 类型），防止 Entity 泄露。
  - _Bad_: `Task<List<Comment>> GetCommentsAsync(...)`
  - _Good_: `Task<List<CommentDto>> GetCommentsAsync(...)`
- **Unified Mappers Layer**: 使用 `Mappers/` 目录统一管理 Entity -> DTO 映射逻辑。
  - 采用 `Func<TEntity, TDto>` 委托模式，可在 `.Select()` 中直接使用。

### 2.2.1 前端一致性检查 ✨ (New)

- **入口完整性**: 每次添加新页面时，必须检查：
  - `Navbar.tsx` (桌面端) 是否已添加入口？
  - `MobileBottomBar` 或 `Sidebar` (移动端/管理后台) 是否已添加入口？
- **移动端优先**: 所有管理页面必须适配移动端（单列布局、响应式表格、Drawer 替代 Dialog）。
- **视觉一致性**: 必须复用现有的 Shadcn/UI 组件和 Tailwind 类，禁止自造样式。

### 2.3 Performance & Resources

- **Database Access**:
  - **READs**: Must use `.AsNoTracking()` by default.
  - **N+1**: Detect loops triggering DB calls. Suggest `.Include()` or `.AsSplitQuery()`.
  - **Projections**: Fetch ONLY needed fields (e.g., `.Select(x => new DTO { ... })`).
- **Frontend Optimization**:
  - Use `Server Components` (RSC) by default. Only use `'use client'` for interactivity.
  - Check for `Image` component usage (Next.js Optimization) vs standard `<img>`.

### 2.4 Maintainability & Evolution

- **Future-Proofing**: Avoid SQLite-specific functions (e.g., `json_extract`) that break PostgreSQL migration.
- **Magic Strings**: Hardcoded roles ("Admin") or config keys must move to `Constants` or `appsettings.json`.
- **Error Handling**: No empty `catch` blocks. All exceptions must propagate to `GlobalExceptionHandler`.

---

## 3. 📝 Coding Standards (The "Do's and Don'ts")

### 3.1 Backend (.NET 10) Rules

**✅ DO:**

- Use `record` for all DTOs (Immutability).
- Use `GlobalExceptionHandler` for error responses.
- Use `Serilog` with structured logging (Template strings, not interpolation).
  - _Right_: `_logger.LogInformation("User {UserId} logged in", userId);`
  - _Wrong_: `_logger.LogInformation($"User {userId} logged in");`

**❌ DON'T:**

- **NO Logic in Controllers**. If a Controller method has > 5 lines of logic, refactor it.
- **NO Generic Repository Pattern**. Use `DbContext` directly in Services (Unit of Work is already built-in).
- **NO Synchronous I/O**. Use `await` for all DB and File operations.

### 3.2 API 响应格式规范 (Required)

所有 API 必须使用统一的响应格式：

```csharp
// ✅ 成功 - 列表
return Ok(new {
    success = true,
    data = items,
    meta = new { page, pageSize, totalCount, totalPages, hasMore }
});

// ✅ 成功 - 单条
return Ok(new { success = true, data = item });

// ✅ 成功 - 操作
return Ok(new { success = true, message = "操作成功" });

// ✅ 失败 - NotFound
return NotFound(new { success = false, message = "资源不存在" });

// ✅ 失败 - BadRequest
return BadRequest(new { success = false, message = "参数错误详情" });

// ❌ 错误 - 直接返回实体
return Ok(entity);  // 缺少 success 包装

// ❌ 错误 - 缺少 success 字段
return NotFound(new { message = "不存在" });
```

### 3.3 Frontend (Next.js 16) Rules

**✅ DO:**

- Use **Server Actions** for mutations (POST/PUT/DELETE).
- Use `zod` for form validation on both Client and Server.
- Use `Optimistic UI` for high-frequency actions (Like, Comment).

**❌ DON'T:**

- **NO Direct API Calls in Components** for data fetching. Use `fetch` in Server Components or Server Actions.
- **NO `useEffect` for Data Fetching**. Use RSC (React Server Components) data fetching patterns.
- **NO Sensitive Data in Client Props**. Never pass full User objects if only `nickname` is needed.

### 3.4 前端布局规范 (Required)

详见 [FRONTEND_LAYOUT_STANDARDS.md](file:///Volumes/fanxiang/MyTechBlog/docs/guides/FRONTEND_LAYOUT_STANDARDS.md)

**核心规则速查**:

```tsx
// 容器 Padding (Admin 页面)
className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-{size}"

// 容器 Padding (Public 页面)
className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-{size}"

// 返回按钮 (移动端仅图标)
<Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
  <ChevronLeft className="w-4 h-4" />
  <span className="sr-only">返回</span>
</Button>

// 网格布局 (移动端单列，桌面双列)
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
```

### 3.4.1 UI 组件标准化规范 ✨ (2026-01 新增)

本项目使用标准化 UI 组件确保页面布局和状态显示一致性。

**组件路径**: `frontend/components/common/`

| 组件            | 用途                                           | 导入方式                                                        |
| --------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| `PageContainer` | 统一页面容器 padding 和 max-width              | `import { PageContainer } from '@/components/common'`           |
| `EmptyState`    | 统一空状态显示 (图标 + 标题 + 描述 + 操作按钮) | `import { EmptyState } from '@/components/common'`              |
| `TableSkeleton` | 表格骨架屏加载                                 | `import { TableSkeleton } from '@/components/common/skeletons'` |
| `PageSkeleton`  | 页面骨架屏加载                                 | `import { PageSkeleton } from '@/components/common/skeletons'`  |

**PageContainer 使用规范**:

```tsx
// ✅ Admin 页面
<PageContainer variant="admin" maxWidth="5xl">
  <AdminPageHeader ... />
  {/* 页面内容 */}
</PageContainer>

// ✅ Public 页面
<PageContainer variant="public" maxWidth="4xl">
  {/* 页面内容 */}
</PageContainer>

// ❌ 禁止 - 手写容器样式
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
```

**EmptyState 使用规范**:

```tsx
// ✅ 正确
<EmptyState
  icon={<Package className="w-12 h-12" />}
  title="暂无商品"
  description="点击上方按钮添加商品"
  action={<Button onClick={handleAdd}>添加</Button>}
/>

// ❌ 禁止 - 手写空状态样式
<div className="text-center py-12 text-gray-500 ...">暂无数据</div>
```

**Link 包裹卡片规范**:

```tsx
// ✅ 正确 - Link 必须添加 block 类
<div className="space-y-4">
  {items.map(item => (
    <Link key={item.id} href={`/item/${item.id}`} className="block">
      <Card>...</Card>
    </Link>
  ))}
</div>

// ❌ 错误 - 缺少 block 导致 space-y 间距失效
<Link key={item.id} href={`/item/${item.id}`}>
  <Card>...</Card>
</Link>
```

**原生弹窗禁止使用**:

```tsx
// ❌ 禁止 - 使用原生 alert/confirm
if (!confirm("确定要删除吗？")) return;
alert("操作失败");

// ✅ 正确 - 使用 Shadcn AlertDialog 或 toast
<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <AlertDialogContent>...</AlertDialogContent>
</AlertDialog>;

toast.error("操作失败");
```

### 3.5 API 类型自动生成规范 ✨ (2026-01 新增)

本项目使用 **openapi-typescript** 从后端 Swagger 自动生成 TypeScript 类型，消除前后端 DTO 的人工同步负担。

**架构示意**:

```
后端 C# DTO ──[Swagger]──► api-types.ts ──[映射层]──► types.ts
     ✅ 自动                    ✅ 自动              ✅ 类型安全
```

**工作流**:

1. **开发时**: 当后端 DTO 变更时，运行 `npm run gen-types`（需后端运行中）
2. **提交时**: 必须将 `frontend/lib/generated/api-types.ts` **提交到 Git**
3. **构建时**: CI/CD 直接读取文件，**不连接后端**

**脚本用法**:

```bash
# 默认连接本地 5095 (源码运行)
npm run gen-types

# 指定 Docker 环境
SWAGGER_URL=http://localhost:8080/swagger/v1/swagger.json npm run gen-types
```

**类型映射层规范** (`frontend/lib/types.ts`):

```typescript
import type { components } from "./generated/api-types";

// 辅助类型：处理 Swagger 的可空推断
type RequiredFields<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

// 导出别名，业务代码使用简洁名称
export type UserPresence = RequiredFields<
  components["schemas"]["UserPresenceDto"],
  "status" | "icon" | "message" | "timestamp"
>;
```

**后端配合要求**:

- Controller 返回 DTO 时必须添加 `[ProducesResponseType(typeof(XxxResponse), 200)]`
- 创建响应包装类型（如 `UserPresenceResponse`）让 Swagger 能推断完整结构

### 3.6 E2E 测试规范 ✨ (2026-01 升级版)

本项目使用 **Playwright** 进行生产级端到端测试，验证前后端集成的关键路径。

**测试文件位置**: `frontend/tests/*.spec.ts`

**核心原则**:

1. **真实环境**: 尽可能连接真实后端容器，而非 Mock API（除非测试第三方服务故障）。
2. **移动端优先**: 关键管理流程必须包含 Mobile Viewport 测试。
3. **零脏数据**: 测试产生的数据应具有可识别性或自动清理。

#### 3.6.1 运行配置与安全

| 环境变量              | 说明                              | 默认值/要求               |
| :-------------------- | :-------------------------------- | :------------------------ |
| `E2E_BASE_URL`        | 测试目标地址                      | `http://localhost:3000`   |
| `TEST_ADMIN_USER`     | 管理员用户名                      | **必须**从 CI Secret 读取 |
| `TEST_ADMIN_PASSWORD` | 管理员密码                        | **必须**从 CI Secret 读取 |
| `CI`                  | CI 环境标识 (禁用 only, 开启重试) | `false`                   |

```bash
# 运行所有测试 (包含 Desktop & Mobile)
npm run test:e2e

# 仅运行 UI 交互模式 (调试用)
npm run test:e2e:ui
```

#### 3.6.2 编写规范 (Production Grade)

**1. 使用 Fixtures 模式**
推荐封装 `adminPage` 或 `authedRequest` fixture，简化登录逻辑并统一鉴权状态。

```typescript
// ✅ Good: 自动处理登录状态与清理
test("管理员可以删除评论", async ({ adminPage }) => {
  await adminPage.goto("/admin/comments");
  // ...
});
```

**2. 数据隔离与清理 (Data Hygiene)**
所有测试生成的实体（文章、评论、标签）必须使用统一前缀，以便于生产环境识别和清理：

- **格式**: `[E2E_AUTO] <当前时间戳> <名称>`
- **清理**: 在 `test.afterAll` 中调用清理 API，或配置定时任务删除该前缀数据。

**3. 视觉回归测试 (Visual Regression)**
不仅仅是保存截图，更要**比对**截图，防止 CSS 样式倒退：

```typescript
// ✅ 验证页面布局未发生非预期变化
await expect(page).toHaveScreenshot("admin-dashboard-mobile.png", {
  maxDiffPixels: 100, // 允许微小像素差异 (抗锯齿等)
  fullPage: true,
});
```

**4. 移动端强制测试**
在 `playwright.config.ts` 中必须保留 `Mobile Chrome` 项目，并在关键 UI 测试中显式覆盖：

```typescript
test.describe("移动端适配", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 13

  test("侧边栏应折叠为汉堡菜单", async ({ page }) => {
    // ...
  });
});
```

#### 3.6.3 测试覆盖清单与注意事项

| 测试文件                 | 关键覆盖点                        | 备注                     |
| :----------------------- | :-------------------------------- | :----------------------- |
| `auth.spec.ts`           | 登录/登出、JWT 过期处理           | **Serial Mode** (防限流) |
| `admin-comments.spec.ts` | 批量审核、删除、移动端表格适配    | 需验证截图比对           |
| `post-creation.spec.ts`  | Markdown 编辑器、图片上传         | **必须清理生成的数据**   |
| `layout-mobile.spec.ts`  | Navbar 响应式、底部导航栏(Mobile) | 纯 UI 布局测试           |

**注意事项**:

- **登录限流**: 登录 API 有频率限制（每分钟 5 次），测试代码必须复用 Token (StorageState)。
- **API 契约**: 必须验证 JSON 响应符合 `{ success: true, data: ... }` 统一格式。
- **截图目录**: 统一输出至 `frontend/test-results/screenshots/`。

---

## 4. 🚀 Specific Workflows

### 🛠 Workflow: Refactoring Legacy Code

1. **Identify Smell**: Point out _why_ the current code is bad (e.g., "Violates SRP").
2. **Define Strategy**: Explain the refactoring pattern (e.g., "Extract Method", "Move to Service").
3. **Code**: Provide the "After" code.
4. **Verify**: Explain how this improves Testability or Performance.

### 🧪 Workflow: Unit Testing Strategy

1. **Scope**: 优先测试业务逻辑 (Service)，其次是 Controller。
2. **Troubleshooting**: 如果单元测试逻辑看起来正常但失败了，**首先怀疑前台或业务代码有 Bug**，而不是盲目修改测试逻辑来迁就代码。
3. **Isolation**: 使用 `InMemory` 数据库进行测试，确保无外部依赖。

### ✨ Workflow: New Feature Implementation

1. **Define Contract**: Start with the `DTO` (Input/Output).
2. **Service Layer**: Define the Interface `IService` and Implementation.
3. **API Layer**: Create the Controller Endpoint.
4. **UI Layer**: Create the Server Action -> Component connection.

---

## 5. 🔮 Strategic Roadmap (Context for Decision Making)

> Keep these long-term goals in mind when suggesting solutions.

- **Phase 1 (Current)**: Docker + SQLite + MemoryCache.
- **Phase 2 (Planned)**:
  - **Migration to PostgreSQL**: Avoid raw SQL that is incompatible.
  - **Migration to Redis**: Design cache keys nicely (e.g., `blog:posts:{id}`).
- **Observability**: Future integration with OpenTelemetry. Encourage comprehensive logging now.

---

## 6. 审计报告模板

当要求**审查**或**审计**代码时，使用以下格式：

| Severity    | Category    | Location   | Issue    |
| ----------- | ----------- | ---------- | -------- |
| 🔴 Critical | Security    | `file.cs`  | 问题描述 |
| 🟡 Major    | Performance | `file.tsx` | 问题描述 |
| 🟢 Minor    | Style       | `file.ts`  | 问题描述 |

然后提供**深度分析**和**重构建议**（Before vs After 代码块）。

---

## 7. 📖 代码风格与注释规范

> **核心原则**: "让代码自解释，让注释讲故事"

### 7.1 后端命名规范 (.NET/C#)

| 类型          | 风格               | 示例                                |
| ------------- | ------------------ | ----------------------------------- |
| **类名**      | PascalCase         | `PostService`, `PostsApiController` |
| **接口**      | IPascalCase        | `IPostService`, `IImageService`     |
| **方法**      | PascalCase + Async | `GetAllPostsAsync`                  |
| **参数/变量** | camelCase          | `userId`, `pageSize`                |
| **私有字段**  | \_camelCase        | `_context`, `_logger`               |

### 7.2 前端命名规范 (TypeScript/React)

| 类型          | 风格             | 示例                          |
| ------------- | ---------------- | ----------------------------- |
| **组件**      | PascalCase       | `PostList`, `StatsWidget`     |
| **函数**      | camelCase        | `fetchComments`, `toggleLike` |
| **类型/接口** | PascalCase       | `PostDetail`, `Comment`       |
| **常量**      | UPPER_SNAKE_CASE | `SITE_CONFIG`                 |

### 7.3 注释规范

**后端**: 使用 XML 文档注释 (`/// <summary>`) + 业务逻辑分步编号

**前端**: 文件头模块说明 + `[Admin]` 标记管理员函数

**禁止**: 过时注释、废话注释、注释掉的代码

### 7.4 格式化工具

| 平台  | 工具     | 缩进   | 行宽 |
| ----- | -------- | ------ | ---- |
| .NET  | VS/Rider | 4 空格 | 120  |
| React | Prettier | 2 空格 | 80   |

```ini
# .editorconfig
[*.cs]
indent_size = 4

[*.{ts,tsx}]
indent_size = 2
```

---

## 8. 📧 邮件模板管理系统 (Email Template System)

### 8.1 架构概览

| 组件           | 文件路径                                                       | 说明                                                                                      |
| :------------- | :------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **实体模型**   | `backend/Models/EmailTemplate.cs`                              | 包含 TemplateKey, Name, SubjectTemplate, BodyTemplate, Description, AvailablePlaceholders |
| **DTO**        | `backend/DTOs/EmailTemplateDtos.cs`                            | `EmailTemplateDto` 和 `UpdateEmailTemplateDto`                                            |
| **服务接口**   | `backend/Services/IEmailTemplateService.cs`                    | GetAllAsync, GetByKeyAsync, UpdateAsync, RenderAsync                                      |
| **服务实现**   | `backend/Services/EmailTemplateService.cs`                     | 包含 30 分钟内存缓存，占位符替换逻辑                                                      |
| **API 控制器** | `backend/Controllers/Api/EmailTemplatesController.cs`          | GET/PUT /api/email-templates/{key}                                                        |
| **前端页面**   | `frontend/app/(admin)/admin/settings/email-templates/page.tsx` | 列表 + 编辑对话框 + iframe 预览                                                           |
| **API 函数**   | `frontend/lib/api.ts`                                          | fetchEmailTemplates, updateEmailTemplate                                                  |

### 8.2 占位符规则

使用 `{{PlaceholderName}}` 语法，简单字符串替换：

```csharp
// RenderAsync 方法内部实现
public string RenderPlaceholders(string template, Dictionary<string, string> data)
{
    foreach (var (key, value) in data)
        template = template.Replace($"{{{{{key}}}}}", value ?? "");
    return template;
}
```

### 8.3 默认模板

| TemplateKey            | 名称           | 触发场景                     |
| :--------------------- | :------------- | :--------------------------- |
| `new_comment`          | 新评论通知     | 文章收到新评论时通知站长     |
| `spam_comment`         | 敏感词审核通知 | 评论触发敏感词拦截时通知站长 |
| `reply_notification`   | 回复通知       | 用户评论被回复时通知该用户   |
| `anniversary_reminder` | 纪念日提醒     | 纪念日临近时发送邮件提醒     |

### 8.4 安全考量

- **iframe 沙箱**: 预览使用 `sandbox="allow-same-origin"` 属性防止 XSS
- **Admin Only**: 所有 API 端点添加 `[Authorize(Roles = "Admin")]`
- **参数化查询**: EF Core 默认行为，防止 SQL 注入

---

## 9. 📚 文档管理规范 (Documentation Standard)

> 为保持项目整洁，文档必须严格按照以下目录结构归档。

### 9.1 目录结构

```text
docs/
├── architecture/       # [Arch] 架构决策、模块设计 (e.g., EMAIL_TEMPLATES.md)
├── context/            # [Context] AI 上下文与系统规范 (e.g., GEMINI.md, AI_CONTEXT.md)
├── guides/             # [Guide] 开发者指南、故障排查、学习笔记
├── reports/            # [Report] 审计报告、技术债清单
├── planning/           # [Plan] 阶段性规划文档
└── archive/            # [Archive] 过时的历史文档
```

### 9.2 维护规则

- **根目录洁癖**: 项目根目录仅保留 `README.md` 和必要的工程配置文件。
- **索引更新**: 每次新增文档后，必须同步更新 `docs/README.md` 中的索引链接。

---

## 10. 🏛️ 架构修正案 (Architecture Amendments)

> 记录在开发过程中迭代产生的架构修正规则。

### 10.1 Controller 归位原则

- **Admin API**: 所有后台管理专用 API (**仅**管理员可访问) **必 须** 放在 `backend/Controllers/Admin/` 目录下。
- **Public API**: 面向公众或通用的 API 放在 `backend/Controllers/Api/` 下。
- **Namespace**: 必须与目录结构保持一致 (`MyNextBlog.Controllers.Admin` vs `MyNextBlog.Controllers.Api`)。

### 10.2 数据播种 (Data Seeding) 幂等性

- **Upsert 策略**: `DataSeeder` 中的逻辑必须是幂等的 (Idempotent)。
  - **Exits**: Skip or Update Metadata (Description, Props).
  - **Not Exits**: Insert Default.
  - **Critical**: 绝不允许覆盖用户可能修改的业务数据 (如模板内容、配置值)。

### 10.3 Service 层设计

- **参数爆炸 (Parameter Explosion)**: 避免在方法中传递超过 5 个参数。
  - _Bad_: `SendNotification(id, title, content, user, email, ...)`
  - _Good_: 传递 ID 并在 Service 内部通过 `Include` 拉取完整聚合根；或使用 DTO 对象。

---

## 11. 📱 移动端响应式布局规范 (Mobile Responsive Design)

> 确保所有页面在 iPhone (375px-430px) 上有良好的显示效果。

### 11.1 Tailwind 断点使用

本项目使用 **Tailwind CSS v4** 默认断点：

| 断点     | 宽度     | 典型设备                 | 使用场景       |
| -------- | -------- | ------------------------ | -------------- |
| (无前缀) | < 640px  | **iPhone、Android 手机** | 移动端基础样式 |
| `sm:`    | ≥ 640px  | 大手机横屏、小平板       | 平板/桌面增强  |
| `md:`    | ≥ 768px  | iPad Mini、平板          | 多列布局切换   |
| `lg:`    | ≥ 1024px | iPad Pro、笔记本         | 侧边栏显示     |

**关键认知**: iPhone 13/14/15 (390px) 和早期 iPhone (375px) 都**小于 `sm:` (640px)**，因此移动端实际使用的是**无前缀的基础样式**。

### 11.2 容器 (Container) 规范

所有页面容器必须使用统一的响应式 padding 模式：

```tsx
// ✅ 正确
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">

// ❌ 错误 - 缺少响应式 padding
<div className="container mx-auto px-4 py-8 max-w-6xl">
```

### 11.3 元素宽度约束规范

| 元素类型         | 移动端策略                      | 桌面端策略     | 示例                                             |
| ---------------- | ------------------------------- | -------------- | ------------------------------------------------ |
| **标题/文本**    | 固定 `max-w-[Xpx]` + `truncate` | 更大的 `max-w` | `max-w-[140px] sm:max-w-[280px] truncate`        |
| **下拉菜单**     | `w-auto` + `min-w` + `max-w`    | 固定宽度       | `w-auto min-w-[4rem] max-w-[5.5rem] sm:w-28`     |
| **按钮(带文字)** | 仅图标 `size="icon"`            | 图标+文字      | `<span className="hidden sm:inline">返回</span>` |
| **Grid 子项**    | `min-w-0` 防止溢出              | 正常           | `<div className="min-w-0">...</div>`             |

### 11.4 间距 (Gap/Padding) 规范

| 场景              | 移动端   | 桌面端    | 示例                                 |
| ----------------- | -------- | --------- | ------------------------------------ |
| Flex gap          | 4px-8px  | 12px-16px | `gap-1 sm:gap-3`                     |
| Container padding | 16px     | 24px-32px | `px-4 sm:px-6 lg:px-8`               |
| Grid gap          | 8px-12px | 16px-24px | `gap-2 sm:gap-3` 或 `gap-3 sm:gap-4` |
| Section margin    | 24px     | 32px      | `mb-6 sm:mb-8`                       |

### 11.5 网格布局 (Grid) 规范

**双列表单默认模式**:

```tsx
// ✅ 移动端单列，平板及以上双列
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

// ⚠️ 若必须保持移动端双列，确保：
// 1. 每列最小内容宽度 + gap + padding ≤ 160px
// 2. 所有子项添加 min-w-0
<div className="grid grid-cols-2 gap-2 sm:gap-3">
  <div className="min-w-0">...</div>
  <div className="min-w-0">...</div>
</div>
```

### 11.6 返回按钮标准模式

```tsx
// ✅ 移动端仅图标，桌面端图标+文字
<Button
  variant="ghost"
  size="icon"
  onClick={() => router.back()}
  className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
>
  <ChevronLeft className="w-4 h-4" />
  <span className="sr-only">返回</span>
</Button>

// 或使用响应式文字显示
<Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3">
  <ChevronLeft className="w-4 h-4" />
  <span className="hidden sm:inline ml-1">返回</span>
</Button>
```

### 11.7 iOS 特殊处理

iOS Safari 对某些表单元素有特殊渲染行为，需在 `globals.css` 中添加全局重置：

```css
@layer base {
  /* iOS 日期/时间输入框重置 */
  input[type="date"],
  input[type="time"],
  input[type="datetime-local"] {
    -webkit-appearance: none;
    appearance: none;
    min-width: 0;
    min-height: auto;
    background-color: transparent;
  }
}
```

### 11.8 日期计算一致性

跨页面的日期倒计时计算必须使用统一逻辑：

```tsx
// ✅ 正确 - 归一化到午夜再计算
const getDaysRemaining = (startDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return Math.round(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
};

// ❌ 错误 - 时间差导致计算偏差
const diff = differenceInDays(startDate, new Date()); // 可能少算一天
```

### 11.9 条件渲染占位规范 ✨ (2026-01 新增)

**问题**: 当表格或卡片中使用条件渲染 (`{condition && <Badge>}`) 时，不满足条件的行会因为缺少元素而导致**行高不一致**。

**解决方案**: 始终渲染占位元素，使用 `invisible` 类隐藏但保留空间：

```tsx
// ❌ 错误 - 行高不一致
<div className="inline-flex items-center gap-1.5">
  <Badge>5 公开</Badge>
  {hiddenCount > 0 && <Badge>3 隐藏</Badge>}  // 0 时无元素，行变矮
</div>

// ✅ 正确 - 始终渲染占位元素
<div className="inline-flex items-center gap-1.5">
  <Badge>5 公开</Badge>
  <Badge className={`${hiddenCount === 0 ? 'invisible' : ''}`}>
    {hiddenCount} 隐藏
  </Badge>
</div>
```

**适用场景**:

- 表格中的可选 Badge 列 (如：标签/分类的隐藏文章数)
- 卡片中的元数据显示 (如：评论状态、文章统计)
- 任何需要保持行高一致的并排元素

---

**最后更新**: 2026-01-12
