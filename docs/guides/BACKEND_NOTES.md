# MyNextBlog 后端学习指南

这份指南旨在帮助初学者快速理解本项目的后端架构（ASP.NET Core 10 Web API）。
**代码本身现在包含了极其详细和全面的中文注释，这些行内注释是理解项目细节和 C#/.NET Core 概念的最佳资料。**

本指南将作为一个高层导航图，帮助你：

1. 建立对项目整体架构的认识。
2. 了解各个文件和模块的功能和职责。
3. 快速定位到你感兴趣或需要深入学习的代码区域。

**建议的学习方法：**
从本指南了解模块概览，然后直接深入到相应的代码文件中阅读详细的行内注释。

## 1. 核心架构模式

本项目采用了典型的 **分层架构 (Layered Architecture)**，将职责分离，便于维护和扩展。

```mermaid
graph TD
    User[用户/前端] --> Controller[控制器层 (API)]
    Controller --> Service[业务逻辑层 (Service)]
    Service --> Data[数据访问层 (EF Core / DbContext)]
    Data --> Database[(SQLite 数据库)]
    Service --> External[外部服务 (Cloudflare R2, etc.)]
```

### 各层职责：

- **Controllers (`Controllers/Api/`)**:
  - **作用**: 也就是“前台”。负责接收 HTTP 请求，验证参数格式，调用 Service 干活，最后把结果打包返回给前端。
  - **原则**: 控制器应该很“薄”，只做路由和简单的参数校验，不要写复杂的业务逻辑。
  - **学习重点**: `PostsApiController.cs` (标准的 CRUD 操作), `AuthController.cs` (登录逻辑).

- **Services (`Services/`)**:
  - **作用**: 也就是“大厨”。负责核心业务逻辑。比如“发布文章”不仅仅是存数据库，还要提取摘要、处理图片关联等，这些都在这里完成。
  - **原则**: 所有的业务规则都写在这里。Service 依赖于 DbContext。
  - **学习重点**: `PostService.cs` (核心业务), `ImageService.cs` (图片生命周期管理).

- **Models (`Models/`)**:
  - **作用**: 也就是“食材”。定义了数据库中长什么样。每个类对应数据库的一张表。
  - **学习重点**: `Post.cs` (看属性定义), `AppDbContext.cs` (看表与表的关系配置).

- **DTOs (`DTOs/`)**:
  - **作用**: 也就是“摆盘”。Data Transfer Object (数据传输对象)。
  - **为什么需要它？**: 数据库里的原始数据 (`Model`) 可能包含敏感信息（如密码哈希），或者结构太复杂（包含循环引用）。DTO 用来定义“前端到底需要什么数据”，不多也不少。
  - **学习重点**: `PostDtos.cs` (区分 Summary 和 Detail).

> [!IMPORTANT]
> **DTO 验证规范 (.NET 8+)**
>
> 在 record 类型的 DTO 中，验证特性必须**直接**放在构造函数参数上，**不能**使用 `[property:]` 前缀：
>
> ```csharp
> // ✅ 正确
> public record CreatePostDto(
>     [Required(ErrorMessage = "标题不能为空")]
>     string Title
> );
>
> // ❌ 错误 - 会导致 500 错误
> public record CreatePostDto(
>     [property: Required(ErrorMessage = "标题不能为空")]
>     string Title
> );
> ```
>
> 详见 [问题集锦 #4](./TROUBLESHOOTING.md#问题-4record-dto-验证特性导致-500-错误)。

## 2. 关键文件导读

建议按照以下顺序阅读代码：

1.  **`Program.cs` (入口)**
    - 这是整个程序的起点。
    - 看点：**依赖注入 (DI)** 的配置（`builder.Services.AddScoped...`）和 **中间件管道** 的组装（`app.Use...`）。

2.  **`Data/AppDbContext.cs` (数据库配置)**
    - 看点：`OnModelCreating` 方法。这里用 "Fluent API" 定义了复杂的数据库关系（如文章和标签的多对多关系）。

3.  **`Controllers/Api/PostsApiController.cs` (接口实现)**
    - 看点：如何使用 `[HttpGet]`, `[HttpPost]` 定义接口；如何通过构造函数注入 Service。

4.  **`Services/PostService.cs` (业务逻辑)**
    - 看点：如何使用 EF Core (`context.Posts...`) 进行数据库查询；`Include` 是怎么加载关联数据的。

## 3. 特色功能解析

### 身份认证 (Authentication)

- **机制**: JWT (JSON Web Token)。
- **流程**: 用户登录 -> 后端签发 Token (包含用户 ID 和 Role) -> 前端把 Token 放在 Header 里请求 -> 后端 `[Authorize]` 属性拦截验证。
- **代码**: `AuthService.cs` (签发), `Program.cs` (配置验证规则).

### 图片管理系统 (Image Management)

- 这是一个比较高级的功能。
- **问题**: 用户上传了图片但没点“发布文章”，这些图片就成了垃圾文件。
- **解决**:
  1. 上传时图片状态为“游离” (`UploadController.cs`)。
  2. 发布文章时，自动扫描内容关联图片 (`ImageService.AssociateImagesAsync`)。
  3. 后台通过 `CleanupOrphanedImagesAsync` 定期清理没人认领的图片。
- **存储**: 使用 Cloudflare R2 (兼容 AWS S3) 对象存储，代码在 `R2StorageService.cs`。

### 数据库自动备份

- **机制**: 使用后台托管服务 (`BackgroundService`)。
- **代码**: `DatabaseBackupService.cs`。它是一个独立运行的线程，每天把 SQLite 文件打包上传到云端。

## 4. 如何开始修改？

如果你想添加一个新功能（比如“友情链接”）：

1.  **Model**: 在 `Models/` 下新建 `FriendLink.cs`，并在 `AppDbContext.cs` 加 `DbSet<FriendLink>`。
2.  **Migration**: 运行 `dotnet ef migrations add AddFriendLink` 生成数据库变更脚本。
3.  **Service**: 创建 `Services/FriendLinkService.cs` 写增删改查逻辑，并在 `Program.cs` 注册它。
4.  **Controller**: 创建 `Controllers/Api/FriendLinksController.cs` 暴露接口。

祝你学习愉快！
