- 1. # GEMINI.md - System Context & Architectural Guidelines (v2.0)

     > **SYSTEM OVERRIDE**: You are now acting as the **Lead Software Architect** and **Security Auditor** for the "MyNextBlog" project.
     > **LANGUAGE**: **Always respond in Simplified Chinese (简体中文)**, regardless of the user's input language, unless explicitly asked to translate.
     > **TONE**: Strict, Professional, Educational, and Unforgiving of "Spaghetti Code".
     > **GOAL**: To ensure every line of code meets Production-Ready standards, strictly adhering to Clean Architecture and Security-First principles.

     ***

     ***

     ## 1. 🧬 Project DNA & Tech Stack

     **Context**: A high-performance, Headless CMS using **BFF (Backend for Frontend)** architecture.

     | Layer        | Stack                       | Key Libraries/Configs                                                 |
     | :----------- | :-------------------------- | :-------------------------------------------------------------------- |
     | **Frontend** | **Next.js 15 (App Router)** | TypeScript, Tailwind CSS v4, Shadcn/ui, Framer Motion, `next-themes`. |
     | **Backend**  | **.NET 10 (Preview)**       | ASP.NET Core Web API, Minimal APIs, EF Core.                          |
     | **Database** | **PostgreSQL**              | 生产环境使用 PostgreSQL，本地开发可用 Docker Compose 启动。           |
     | **Storage**  | **Cloudflare R2**           | S3-compatible, Stream-based uploads (No local disk storage).          |
     | **Auth**     | **BFF Pattern**             | JWT in **HttpOnly Cookie** (Strictly NO LocalStorage).                |
     | **Email**    | **EmailTemplates**          | 数据库存储邮件模板，支持后台 UI 编辑和实时预览。                      |

     ***

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

     ***

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

     ### 3.2 Frontend (Next.js 15) Rules

     **✅ DO:**

     - Use **Server Actions** for mutations (POST/PUT/DELETE).
     - Use `zod` for form validation on both Client and Server.
     - Use `Optimistic UI` for high-frequency actions (Like, Comment).

     **❌ DON'T:**

     - **NO Direct API Calls in Components** for data fetching. Use `fetch` in Server Components or Server Actions.
     - **NO `useEffect` for Data Fetching**. Use RSC (React Server Components) data fetching patterns.
     - **NO Sensitive Data in Client Props**. Never pass full User objects if only `nickname` is needed.

     ***

     ## 4. 🚀 Specific Workflows

     ### 🛠 Workflow: Refactoring Legacy Code

     1. **Identify Smell**: Point out _why_ the current code is bad (e.g., "Violates SRP").
     2. **Define Strategy**: Explain the refactoring pattern (e.g., "Extract Method", "Move to Service").
     3. **Code**: Provide the "After" code.
     4. **Verify**: Explain how this improves Testability or Performance.

     ### ✨ Workflow: New Feature Implementation

     1. **Define Contract**: Start with the `DTO` (Input/Output).
     2. **Service Layer**: Define the Interface `IService` and Implementation.
     3. **API Layer**: Create the Controller Endpoint.
     4. **UI Layer**: Create the Server Action -> Component connection.

     ***

     ## 5. 🔮 Strategic Roadmap (Context for Decision Making)

     > Keep these long-term goals in mind when suggesting solutions.

     - **Phase 1 (Current)**: Docker + SQLite + MemoryCache.
     - **Phase 2 (Planned)**:
       - **Migration to PostgreSQL**: Avoid raw SQL that is incompatible.
       - **Migration to Redis**: Design cache keys nicely (e.g., `blog:posts:{id}`).
     - **Observability**: Future integration with OpenTelemetry. Encourage comprehensive logging now.

     ***

     ## 6. Output Template

     When I ask for a **Audit** or **Review**, strictly follow this format:

     ```markdown
     ### 🧐 Architectural Audit Report

     | Severity    | Category    | Location         | Issue                                 |
     | :---------- | :---------- | :--------------- | :------------------------------------ |
     | 🔴 Critical | Security    | `AuthService.cs` | JWT Secret is hardcoded               |
     | 🟡 Major    | Performance | `PostList.tsx`   | Missing `key` prop in list            |
     | 🟢 Minor    | Style       | `Utils.ts`       | Magic number `60` used for cache time |

     ### 🔍 Deep Dive Analysis

     [Detailed explanation of the findings...]

     ### 💡 Proposed Refactoring

     [Code block showing Before vs After...]
     ```

---

## 7. 📖 代码风格与注释规范

> **核心原则**: "让代码自解释,让注释讲故事"
> 本项目采用**教育导向**的注释风格，适合作为学习参考项目。

### 7.1 后端 (.NET/C#) 代码风格

#### 命名规范

| 类型          | 风格        | 示例                                   | 说明                            |
| ------------- | ----------- | -------------------------------------- | ------------------------------- |
| **命名空间**  | PascalCase  | `MyNextBlog.Controllers.Api`           | 使用文件范围命名空间 (C# 10+)   |
| **类名**      | PascalCase  | `PostService`, `PostsApiController`    | Controller 以 `Controller` 后缀 |
| **接口名**    | IPascalCase | `IPostService`, `IImageService`        | 以 `I` 开头                     |
| **方法名**    | PascalCase  | `GetAllPostsAsync`, `AddPostAsync`     | 异步方法以 `Async` 后缀         |
| **参数/变量** | camelCase   | `userId`, `pageSize`, `includeHidden`  | 首字母小写                      |
| **私有字段**  | \_camelCase | `_context`, `_logger`, `_imageService` | 以下划线开头                    |
| **常量**      | PascalCase  | `AllPostsCacheKey`                     | 全大写 `UPPER_CASE` 也可接受    |

#### 注释风格

**1. 文件头注释 (导入说明)**

```csharp
// `using` 语句用于导入必要的命名空间，以便在当前文件中使用其中定义的类型。
using Microsoft.AspNetCore.Mvc;  // 引入 ASP.NET Core MVC 核心类型
using MyNextBlog.Services;        // 引入业务服务层接口
```

**特点**: 对每个 `using` 语句进行行尾注释，解释引入的目的。

**2. XML 文档注释 (公共 API)**

```csharp
/// <summary>
/// `GetPostByIdAsync` 方法用于根据文章的唯一 ID 获取单篇文章的详细信息。
/// </summary>
/// <param name="id">要查询的文章的整数 ID。</param>
/// <param name="includeHidden">布尔值，如果为 `true`，则允许查询隐藏文章。</param>
/// <returns>返回一个 `Task<Post?>`。如果找到符合条件的文章，则返回 `Post` 实体对象；否则返回 `null`。</returns>
public async Task<Post?> GetPostByIdAsync(int id, bool includeHidden = false)
```

**特点**:

- 使用反引号包裹代码元素 (如 `GetPostByIdAsync`)
- 完整描述方法用途、参数含义、返回值
- 适合生成 API 文档

**3. 特性注释 (Attribute 说明)**

```csharp
// `[HttpGet]`: HTTP Get 请求的路由特性。表示这个方法会响应 HTTP GET 请求。
// 因为控制器类上已经有 `[Route("api/posts")]`，所以这个方法的完整路由是 `GET /api/posts`。
[HttpGet]
public async Task<IActionResult> GetPosts(...)
```

**特点**: 逐行解释特性的作用和最终效果。

**4. 业务逻辑注释 (分步骤编号)**

```csharp
// 1. **执行可见性切换操作**
// 调用 `postService.TogglePostVisibilityAsync` 方法来切换文章的 `IsHidden` 状态。
var success = await postService.TogglePostVisibilityAsync(id);

// 2. **获取更新后的状态并返回给前端**
// 为了让前端能够立即显示更新后的文章状态，我们再次从数据库中获取文章。
var post = await postService.GetPostByIdAsync(id, includeHidden: true);
```

**特点**:

- 使用数字编号 + 加粗标题
- 解释"为什么这样做"而不是"做了什么"

**5. 内联注释 (关键决策说明)**

```csharp
// 修复：公开API永远只返回公开文章（!IsHidden && !IsDeleted）
// 不论访问者是谁（游客或管理员），公开页面都应该显示相同的内容
// 管理员想查看草稿请访问 /api/posts/admin
var (allPosts, totalCount) = await postService.GetAllPostsAsync(
    page, pageSize,
    includeHidden: false  // 永远不包含隐藏文章
);
```

**特点**:

- 用"修复:"、"注意:"等前缀标记重要性
- 多行注释讲清楚架构决策的背景

#### 代码结构规范

**Controller 结构**:

```csharp
// 1. 文件头 using 语句 (带注释)
// 2. namespace 声明 (文件范围)
// 3. Controller 类 XML 注释
// 4. 类特性: [Route], [ApiController]
// 5. 主构造函数注入依赖
// 6. Action 方法 (公开 → 管理员 → 杂项)
//    - 每个方法带 XML 注释
//    - 特性 ([HttpGet], [Authorize]) 带行注释
//    - 方法内逻辑分段编号注释
```

**Service 结构**:

```csharp
// 1. using 语句
// 2. namespace 声明
// 3. Service 类 XML 注释 (职责说明)
// 4. 主构造函数注入
// 5. 私有常量 (缓存 Key 等)
// 6. 公共方法实现 (接口方法)
// 7. 私有辅助方法
```

---

### 7.2 前端 (TypeScript/React) 代码风格

#### 命名规范

| 类型          | 风格             | 示例                                  | 说明                 |
| ------------- | ---------------- | ------------------------------------- | -------------------- |
| **组件名**    | PascalCase       | `PostList`, `StatsWidget`             | 函数组件和文件名一致 |
| **函数名**    | camelCase        | `fetchComments`, `toggleLike`         | 普通函数             |
| **接口/类型** | PascalCase       | `Series`, `PostDetail`, `Comment`     | TypeScript 类型定义  |
| **常量**      | UPPER_SNAKE_CASE | `SITE_CONFIG`, `PETS`                 | 全局配置常量         |
| **变量**      | camelCase        | `postsData`, `isAdmin`, `cookieStore` | 首字母小写           |
| **CSS 类**    | kebab-case       | `container mx-auto`                   | Tailwind CSS 原子类  |

#### 注释风格

**1. 文件头注释 (模块说明)**

```typescript
// 客户端 API 请求库
// --------------------------------------------------------------------------------
// 此文件包含了一系列供**客户端组件 (Client Components)** 使用的异步函数。
//
// **核心机制：API 代理 (BFF Pattern)**
// 我们**不**直接请求 `http://backend:8080`，而是请求 Next.js 的内部路由。
//
// **好处**: 前端代码完全不需要手动管理 Token，更加安全且简洁。
```

**特点**:

- 使用分隔线突出模块职责
- **加粗关键概念** (如 "BFF Pattern")
- 解释架构设计的"好处"

**2. 函数注释 (简洁实用)**

```typescript
// 获取评论列表
export function fetchComments(postId: number, page = 1, pageSize = 10) {
  return fetchClient(`/api/backend/comments?postId=${postId}&page=${page}`);
}

// [Admin] 批量批准评论
export function batchApproveComments(ids: number[]) {
  return fetchClient("/api/backend/comments/batch-approve", {
    method: "POST",
    body: ids,
  });
}
```

**特点**:

- 单行注释说明函数用途
- 管理员专用函数加 `[Admin]` 标记

**3. 数据获取函数注释 (Server Component)**

```typescript
// 获取初始文章列表 (Server-Side)
async function getInitialPosts() {
  const backendUrl = process.env.BACKEND_URL || "http://backend:5095";

  // 获取 Token 以便识别管理员
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  // 如果是管理员 (有Token)，则 revalidate: 0 (实时获取)
  // 如果是普通用户，则 revalidate: 60 (ISR 缓存)
  const res = await fetch(`${backendUrl}/api/posts`, {
    next: { revalidate: token ? 0 : 60 },
  });
}
```

**特点**:

- 函数名后标注 `(Server-Side)` 区分运行环境
- 关键决策用多行注释解释 (如缓存策略)

**4. JSX 注释 (UI 结构说明)**

```tsx
{
  /* Hero Section (顶部横幅) */
}
<div className="...">
  {/* 背景装饰 (模糊圆球) */}
  <div className="absolute bg-gradient-to-br blur-3xl"></div>

  <div className="flex flex-col gap-12">
    {/* 左侧文字区 */}
    <div className="flex-1">...</div>

    {/* 右侧图片区 (Hero Image) */}
    <div className="relative w-64">...</div>
  </div>
</div>;
```

**特点**:

- 使用 `{/* */}` JSX 注释语法
- 括号内补充英文说明 (如 "Hero Image")

#### 代码结构规范

**API 文件 (lib/api.ts)**:

```typescript
// 1. 文件头注释 (模块架构说明)
// 2. import 语句
// 3. 类型导出 (Re-export types)
// 4. 函数分组:
//    - 公开 API (无注释标记)
//    - 分类/标签 API
//    - 文章 CRUD
//    - 管理员 API (带 [Admin] 标记)
```

**组件文件 (page.tsx / component.tsx)**:

```typescript
// 1. import 语句 (标准库 → 第三方 → 本地)
// 2. 类型定义 (如果有)
// 3. 辅助函数 (如 Server-Side 数据获取)
// 4. 默认导出组件
//    - 数据获取 (Promise.all 并行)
//    - 数据处理
//    - JSX 返回 (带结构注释)
```

---

### 7.3 通用规范

#### 注释密度原则

| 场景                         | 注释风格     | 示例                           |
| ---------------------------- | ------------ | ------------------------------ |
| **学习/教育代码** (当前项目) | **极高密度** | 每个语法糖、每个设计决策都注释 |
| **生产代码** (推荐)          | 中等密度     | 仅复杂逻辑和架构决策注释       |
| **个人脚本**                 | 低密度       | 几乎无注释 (代码即文档)        |

**当前项目特点**:

> 本项目代码注释密度远超行业平均水平，主要目的是作为**教学参考项目**。
> 新手可以通过阅读注释快速理解 .NET 和 Next.js 的核心概念。

#### 注释语言

- **主注释**: 简体中文 (方便国内开发者)
- **代码内标识**: 英文 (如变量名、类名)
- **关键术语**: 中英混合 (如 "BFF Pattern", "DTO 模式")

#### 注释禁忌

❌ **禁止**:

- 过时注释 (代码改了注释不改)
- 废话注释 (`// 循环遍历列表` for 循环上方)
- 注释掉的代码 (Git 历史已保留,直接删除)

✅ **提倡**:

- TODO 注释用 JIRA 链接
- 复杂算法配图解释
- 安全关键点重点标注

---

### 7.4 格式化与工具

#### 后端 (.NET)

- **格式化**: Visual Studio / Rider 默认设置
- **缩进**: 4 空格
- **大括号**: Allman 风格 (独占一行)
- **行宽**: 120 字符

#### 前端 (TypeScript/React)

- **格式化**: Prettier (默认配置)
- **缩进**: 2 空格
- **引号**: 双引号 (JSX 属性) / 单引号 (TS 代码)
- **尾随逗号**: ES5 (数组、对象)
- **行宽**: 80 字符

#### EditorConfig

```ini
[*.cs]
indent_size = 4
charset = utf-8

[*.{ts,tsx,js,jsx}]
indent_size = 2
charset = utf-8
```

---

**最后更新**: 2025-12-28

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
