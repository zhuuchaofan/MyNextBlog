# MyNextBlog 后端 API 结构文档

这是一个典型的 **ASP.NET Core Web API** 项目，采用了经典的 **分层架构 (Layered Architecture)**。

整体架构清晰地分为三层：

1.  **API 层 (Controllers)**: 处理 HTTP 请求，验证身份，调用业务逻辑。
2.  **业务逻辑层 (Services)**: 封装核心业务规则，协调数据访问。
3.  **数据访问层 (Data/Models)**: 定义数据结构，直接操作数据库。

---

## 1. 核心架构与配置 (`Program.cs`)

`Program.cs` 文件是应用程序的入口点，负责初始化和配置整个 Web API，包括：

- **依赖注入 (DI)**: 所有的 Service (`IPostService`, `IStorageService`, `ICategoryService`, `IImageService`, `ITagService` 等) 都在这里注册为服务，遵循依赖倒置原则。
- **数据库**: 配置使用 `PostgreSQL` 作为数据存储，通过 `AppDbContext` 进行数据访问。
- **身份认证**: 采用 **JWT (JSON Web Token)** 认证机制处理 API 请求，同时也支持 Cookie 认证方案。
- **存储**: 集成了 `Cloudflare R2` (兼容 AWS S3) 对象存储服务。
- **日志**: 使用 `Serilog` 进行结构化日志记录，便于监控和调试。
- **后台任务**: 注册了 `DatabaseBackupService` 作为后台托管服务，用于每日自动备份数据库。
- **CORS 配置**: 允许特定的前端域名 (如 `http://localhost:3000`, `https://nextblog.zhuchaofan.online`) 跨域访问 API。
- **Swagger/OpenAPI**: 集成了 Swagger，用于自动生成和展示 API 文档。
- **数据播种**: 在应用启动时，检查并自动应用数据库迁移，并可选择性地填充初始数据（如默认分类）。

---

## 2. API 层 (Controllers)

API 层位于 `Controllers/Api` 目录下，负责接收 HTTP 请求，解析请求参数，调用业务逻辑层处理数据，并返回 HTTP 响应。

| 控制器名称               | 路由前缀          | 主要功能          | 方法 (HTTP Verb & Path)                                                                               | 授权要求                 |
| :----------------------- | :---------------- | :---------------- | :---------------------------------------------------------------------------------------------------- | :----------------------- |
| **AccountController**    | `/api/account`    | 管理用户个人信息  | `GET /me`: 获取当前登录用户信息                                                                       | JWT (登录用户)           |
|                          |                   |                   | `POST /avatar`: 上传并更新用户头像                                                                    | JWT (登录用户)           |
| **AuthController**       | `/api/auth`       | 用户认证与登录    | `POST /login`: 用户登录，验证凭据并返回 JWT Token                                                     | 无 (公开)                |
| **CategoriesController** | `/api/categories` | 文章分类管理      | `GET /`: 获取所有文章分类列表                                                                         | 无 (公开)                |
|                          |                   |                   | `GET /{id}`: 获取指定 ID 的分类信息                                                                   | 无 (公开)                |
|                          |                   |                   | `POST /`: 创建新文章分类                                                                              | JWT (Admin 角色)         |
| **CommentsController**   | `/api/comments`   | 博客文章评论系统  | `POST /`: 发表评论 (支持匿名或登录用户)                                                               | 可选 JWT                 |
|                          |                   |                   | `GET /?postId={id}&page={page}`: 获取指定文章的评论列表 (分页)                                        | 无 (公开)                |
| **GalleryController**    | `/api/gallery`    | 图片画廊/资源列表 | `GET /`: 获取所有图片资源 (支持筛选、分页，关联到公开文章的图片)                                      | 无 (公开)                |
| **PostsApiController**   | `/api/posts`      | **核心文章管理**  | `GET /?page={}&search={}&tag={}&categoryId={}`: 获取文章列表 (支持搜索、筛选、分页，自动过滤隐藏文章) | 无 (公开)                |
|                          |                   |                   | `GET /admin?page={}`: 管理员专用文章列表 (包含隐藏文章)                                               | JWT (Admin 角色)         |
|                          |                   |                   | `GET /admin/{id}`: 管理员获取指定文章详情 (包含隐藏文章)                                              | JWT (Admin 角色)         |
|                          |                   |                   | `GET /{id}`: 获取指定文章详情 (非管理员用户会过滤隐藏文章)                                            | 无 (公开)                |
|                          |                   |                   | `POST /`: 创建新文章                                                                                  | JWT (Admin 角色)         |
|                          |                   |                   | `PUT /{id}`: 更新指定文章                                                                             | JWT (Admin 角色)         |
|                          |                   |                   | `DELETE /{id}`: 删除指定文章                                                                          | JWT (Admin 角色)         |
|                          |                   |                   | `PATCH /{id}/visibility`: 切换文章的显示/隐藏状态                                                     | JWT (Admin 角色)         |
| **TagsController**       | `/api/tags`       | 标签管理          | `GET /popular?count={}`: 获取热门标签列表                                                             | 无 (公开)                |
| **UploadController**     | `/api/upload`     | 文件上传服务      | `POST /`: 上传图片文件到 R2 存储                                                                      | JWT (登录用户) 或 Cookie |
|                          |                   |                   | `POST /cleanup`: 手动触发清理未关联文章的“僵尸图片”                                                   | JWT (登录用户) 或 Cookie |

---

## 3. 业务逻辑层 (Services)

业务逻辑层位于 `Services` 目录，封装了应用程序的核心业务规则和逻辑，并与数据访问层进行交互。每个服务通常对应一个或多个接口，实现解耦。

- **`IPostService` & `PostService`**:

  - **职责**: 提供文章相关的 CRUD (创建、读取、更新、删除) 操作。
  - **主要功能**:
    - `GetAllPostsAsync`: 获取所有文章，支持按分类、标签、搜索词筛选，并可选择是否包含隐藏文章。
    - `GetPostByIdAsync`: 根据 ID 获取文章详情，并加载关联数据（分类、作者、标签）。
    - `GetCommentsAsync`, `GetCommentCountAsync`: 获取文章评论（分页）。
    - `AddPostAsync`, `UpdatePostAsync`, `DeletePostAsync`: 文章的完整生命周期管理。
    - `TogglePostVisibilityAsync`: 切换文章的可见性状态。
  - **业务集成**: 在添加/更新文章时，会调用 `IImageService` 接口，自动处理文章内容中图片与文章的关联；删除文章时，会调用 `IImageService` 删除文章关联的物理图片。

- **`IImageService` & `ImageService`**:

  - **职责**: 管理图片资产的生命周期，包括记录、关联和清理。
  - **主要功能**:
    - `RecordImageAsync`: 在图片上传后，记录其 URL 和存储键，此时图片未关联到具体文章。
    - `AssociateImagesAsync`: 扫描文章内容，将图片 URL 与文章 ID 绑定，确保图片属于某篇文章。
    - `DeleteImagesForPostAsync`: 删除指定文章关联的所有图片（包括云端文件和数据库记录）。
    - `CleanupOrphanedImagesAsync`: 定期清理在一定时间内上传但未被任何文章引用的“僵尸图片”，防止存储资源浪费。

- **`IStorageService` & `R2StorageService`**:

  - **职责**: 提供抽象的文件存储服务，目前具体实现是 Cloudflare R2。
  - **主要功能**:
    - `UploadAsync`: 将文件流上传到 R2。**新特性**：支持 `customPrefix` 参数，允许将文件存入指定文件夹（如 `avatars/`, `backups/`）；若未指定，则默认按日期 (`yyyy/MM/dd`) 归档。
    - `DeleteAsync`: 根据存储键从 R2 删除文件。
  - **技术实现**: 使用 AWS SDK for .NET 连接 Cloudflare R2 (与 S3 兼容)，自动处理文件路径生成。

- **`ICategoryService` & `CategoryService`**:

  - **职责**: 管理文章分类的 CRUD 操作。
  - **主要功能**: `GetAllCategoriesAsync`, `GetByIdAsync`, `AddCategoryAsync`, `ExistsAsync`。

- **`ITagService` & `TagService`**:

  - **职责**: 管理文章标签，包括获取热门标签和处理标签的创建/复用。
  - **主要功能**:
    - `GetPopularTagsAsync`: 获取使用频率最高的标签。
    - `GetOrCreateTagsAsync`: 根据标签名称列表，查找或创建新的标签，实现标签的复用和管理。

- **`DatabaseBackupService`**:
  - **职责**: 作为后台服务，周期性地执行数据库备份任务。
  - **主要功能**: 定时 (`TimeSpan.FromHours(24)`) 将当前 SQLite 数据库文件复制一份，并上传到 `IStorageService` (R2) 的 `backups/` 目录下，实现数据库的异地备份和容灾。

---

## 4. 数据访问层 (Models & Data)

数据访问层定义了应用程序的数据结构 (实体模型) 和数据库上下文，负责与数据库进行直接交互。

### 4.1. 实体模型 (Models)

位于 `Models` 目录，定义了应用程序中的各个数据实体及其关系。

- **`Post` (文章)**

  - `Id` (int): 主键
  - `Title` (string): 文章标题 (必填)
  - `Content` (string): 文章正文
  - `CreateTime` (DateTime): 创建时间
  - `IsHidden` (bool): 是否隐藏文章 (默认 `false`)
  - `CategoryId` (int?): 关联的分类 ID (外键，可空)
  - `UserId` (int?): 文章作者的用户 ID (外键，可空)
  - `Category` (Category): 导航属性，指向所属分类
  - `User` (User): 导航属性，指向作者
  - `Comments` (List<Comment>): 导航属性，关联多条评论 (一对多)
  - `Tags` (List<Tag>): 导航属性，关联多个标签 (多对多)

- **`Category` (分类)**

  - `Id` (int): 主键
  - `Name` (string): 分类名称 (必填)
  - `Posts` (List<Post>): 导航属性，关联多篇文章

- **`Tag` (标签)**

  - `Id` (int): 主键
  - `Name` (string): 标签名称 (必填)
  - `Posts` (List<Post>): 导航属性，关联多篇文章 (多对多)

- **`Comment` (评论)**

  - `Id` (int): 主键
  - `Content` (string): 评论内容 (必填)
  - `CreateTime` (DateTime): 创建时间
  - `PostId` (int): 关联的文章 ID (外键)
  - `GuestName` (string?): 访客昵称 (可空，用于匿名评论)
  - `GuestEmail` (string?): 访客邮箱 (可空，目前未使用)
  - `UserId` (int?): 登录用户 ID (外键，可空，用于登录用户评论)
  - `Post` (Post): 导航属性，指向所属文章
  - `User` (User): 导航属性，指向评论用户

- **`User` (用户)**

  - `Id` (int): 主键
  - `Username` (string): 用户名
  - `PasswordHash` (string): 密码哈希值
  - `Role` (string): 用户角色 (默认 "User"，可有 "Admin")
  - `AvatarUrl` (string?): 用户头像 URL (可空)

- **`ImageAsset` (图片资产)**
  - `Id` (int): 主键
  - `Url` (string): 图片的公开访问 URL (必填)
  - `StorageKey` (string): 在存储服务中的唯一键 (必填，用于删除)
  - `UploadTime` (DateTime): 上传时间
  - `PostId` (int?): 关联的文章 ID (外键，可空，`null` 表示图片未被文章引用)
  - `Post` (Post?): 导航属性，指向所属文章

### 4.2. 数据库上下文 (`AppDbContext`)

位于 `Data/AppDbContext.cs`，是 Entity Framework Core 与数据库交互的核心。

- 继承自 `Microsoft.EntityFrameworkCore.DbContext`。
- 通过 `DbSet<T>` 属性暴露各个实体集合，如 `Posts`, `Categories`, `Tags`, `Comments`, `Users`, `ImageAssets`。
- 管理实体模型的映射、数据库连接和事务。
- 利用 `Migrations` 文件夹中的迁移文件来管理数据库结构的版本控制和更新。

---

## 总结

该后端 API 结构清晰，职责明确，通过分层架构和依赖注入，实现了良好的可维护性和可扩展性。特别是在文件存储和图片生命周期管理方面，考虑周全，解决了博客系统常见的痛点。认证系统结合了 JWT 和角色管理，能够灵活支持前端应用和后台管理。后台备份服务进一步提升了数据的安全性。
