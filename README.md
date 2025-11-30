# MyTechBlog - .NET 10 个人技术博客系统学习指南

欢迎来到 **MyTechBlog**！这是一个专为初学者设计的全栈 Web 开发示例项目。它不仅是一个功能完整的博客系统，更是一份生动的学习教材。

通过本项目，你将学习到如何使用微软最新的 **.NET 10 (ASP.NET Core)** 技术栈来构建现代化的 Web 应用程序。

---

## 📖 目录

1. [项目简介与核心功能](#-项目简介与核心功能)
2. [给初学者的核心概念科普](#-给初学者的核心概念科普)
3. [环境准备与运行指南](#-环境准备与运行指南)
4. [项目文件结构完全解析](#-项目文件结构完全解析)
5. [深度功能解析 (代码通过这里看懂)](#-深度功能解析-代码通过这里看懂)
    * [特色的“粘贴即上传”图片功能](#1-特色的粘贴即上传图片功能)
    * [自动管理员权限系统](#2-自动管理员权限系统)
    * [数据库交互流程](#3-数据库交互流程)
6. [下一步学习建议](#-下一步学习建议)

---

## ✨ 项目简介与核心功能

这是一个轻量级的个人博客，主要功能包括：
*   **文章浏览**：访客可以查看博客文章列表和详情。
*   **内容创作**：支持 **Markdown** 语法写作，支持 **Mermaid** 图表渲染，并实现了**“截图直接粘贴上传”**的丝滑体验（图片自动上传至 Cloudflare R2 云存储）。
*   **用户系统**：注册、登录、注销。系统会自动将**第一位注册的用户**设为**管理员**。
*   **评论互动**：支持匿名评论。

---

## 🧠 给初学者的核心概念科普

在深入代码之前，先理解这几个核心术语：

### 1. MVC 架构 (Model-View-Controller)
这是本项目的骨架。
*   **Model (模型)**: **数据的大脑**。定义了数据长什么样（比如文章有标题、内容、时间）。对应 `Models` 文件夹。
*   **View (视图)**: **用户的脸面**。负责显示网页（HTML/CSS）。对应 `Views` 文件夹。
*   **Controller (控制器)**: **调度员**。接收用户的请求（比如“我要看文章”），去 Model 拿数据，然后交给 View 去显示。对应 `Controllers` 文件夹。

### 2. ORM 与 Entity Framework Core (EF Core)
*   **ORM (对象关系映射)**: 让你不用写复杂的 SQL 语句（Select * From...），而是像操作普通 C# 对象一样操作数据库。
*   **Code First**: 我们先写 C# 代码（Model 类），然后让程序自动生成数据库表。

### 3. SQLite
*   这是一个**轻量级数据库**。它不需要你安装庞大的 SQL Server 或 MySQL 软件，整个数据库就是一个单纯的文件 (`blog.db`)，非常适合学习和小型项目。

---

## 🛠 环境准备与运行指南

### 第一步：安装环境
确保你的电脑安装了 **.NET 10 SDK**。
*   在终端输入 `dotnet --version` 检查。

### 第二步：下载代码
（如果你是下载的压缩包或通过 Git 克隆的）进入项目根目录：
```bash
cd MyTechBlog
```

### 第三步：配置云存储 (Cloudflare R2)
本项目使用 Cloudflare R2 存储图片。你需要打开 `appsettings.json` 文件，找到 `CloudflareR2` 配置节，填入你的 R2 凭证和公开访问域名 (`PublicDomain`)。

### 第四步：初始化数据库 (关键！)
因为数据库文件通常不上传到代码仓库，你需要自己在本地生成它。运行：
```bash
dotnet ef database update
```
*成功后，你会看到项目根目录多了一个 `blog.db` 文件。*

### 第五步：启动项目
```bash
dotnet run
```
看到输出 `Now listening on: http://localhost:5xxx` 后，在浏览器打开显示的网址即可。

---

## 📂 项目文件结构完全解析

打开项目文件夹，我们来一一认识它们：

*   **`Program.cs`**: **程序的入口**。这里配置了所有的“服务”（比如数据库连接、身份认证）和“中间件”（比如处理错误、静态文件）。它是整个应用的指挥中心。
*   **`appsettings.json`**: **配置文件**。存放数据库连接字符串等配置信息。
*   **`MyTechBlog.csproj`**: **项目文件**。记录了项目依赖了哪些第三方包（Nuget Packages）。
*   **`Controllers/`**:
    *   `HomeController.cs`: 处理首页请求。
    *   `PostsController.cs`: 处理文章的增删改查。
    *   `AccountController.cs`: 处理登录注册。
    *   `UploadController.cs`: **(重点)** 接收上传图片请求，并调用存储服务将文件上传至云端。
*   **`Models/`**:
    *   `Post.cs`, `Comment.cs`, `User.cs`: 定义了数据库表的结构。
*   **`Views/`**:
    *   `.cshtml` 文件是 C# 和 HTML 的混合体（Razor 语法）。
    *   `Shared/_Layout.cshtml`: **布局页**。就像网页的“模板”，包含导航栏和页脚，所有页面都套用这个壳子。
*   **`wwwroot/`**: **静态资源库**。
    *   `css/`, `js/`: 存放样式和脚本。
    *   `uploads/`: (旧版功能残留) 存放本地上传的图片文件。新版已迁移至 R2 云存储。
*   **`Services/`**:
    *   `PostService.cs`: **业务逻辑层**。封装文章相关的数据库操作。
    *   `IStorageService.cs` / `R2StorageService.cs`: **存储服务**。定义了文件上传的接口，并实现了对接 Cloudflare R2 的逻辑。
    *   `ImageService.cs`: **图片管理服务**。负责追踪每一张图片的归属（是属于哪篇文章，还是未使用的僵尸图片），并负责自动清理。

---

## 🔍 深度功能解析 (代码通过这里看懂)

这里为你拆解项目中几个最值得学习的技术亮点。

### 1. 特色的“粘贴即上传”图片功能 (云端版 + 智能管理)
这通常是商业级编辑器的功能，我们通过前后端配合实现了它，并将图片安全地存储在云端。

*   **原理**：
    1.  **前端 (`wwwroot/js/site.js`)**: 监听输入框的 `paste` (粘贴) 事件。
    2.  **拦截**: 发现剪贴板里是图片，就阻止默认粘贴行为。
    3.  **发送**: 使用 JavaScript 的 `fetch` 把图片数据发给后端 API。
    4.  **后端 (`Controllers/UploadController.cs`)**: 
        *   接收文件流，调用 `R2StorageService` 上传到 Cloudflare R2。
        *   **智能追踪**：调用 `ImageService` 在数据库中记录这张图（此时它是无主的）。
        *   返回图片的公开访问 URL。
    5.  **关联与清理** (`PostService`):
        *   **保存文章时**：自动解析 Markdown 内容，把里面引用的图片与当前文章绑定。
        *   **删除文章时**：自动查找该文章关联的所有图片，从 R2 彻底删除文件，并清除数据库记录。
        *   **僵尸清理**：对于那些上传了但没保存的图片，提供了手动触发的清理接口 (`/api/upload/cleanup`)，一键清除 24 小时前的垃圾文件。

### 2. Mermaid 图表渲染
如何在博客中画流程图、时序图？我们采用了标准化的渲染方案。

*   **后端 (Markdig)**: 虽然我们可以在后端配置 `MarkdownPipeline` 来支持 Mermaid，但为了灵活性，我们主要依赖前端渲染。
*   **前端 (Mermaid.js)**: 在 `Views/Posts/Details.cshtml` 中，我们引入了 `mermaid.js` 库。
    *   脚本自动扫描页面中标记为 `language-mermaid` 的代码块。
    *   将它们动态替换为 SVG 图形，从而实现图表的渲染。

### 3. 自动管理员权限系统
如何在这个简单的系统中区分“管理员”和“普通用户”？看 `Controllers/AccountController.cs` 中的注册逻辑：

```csharp
// 检查数据库里是否已经有用户了
bool isFirstUser = !await context.Users.AnyAsync();
// 如果没人，你就是 Admin (天选之子)；否则你就是 User (路人甲)
string role = isFirstUser ? "Admin" : "User";
```
这种设计让你在本地测试时，注册的第一个号自动拥有所有权限，非常方便。

### 4. 数据库交互流程
以“显示文章列表”为例，数据是如何流动的？

1.  **浏览器**请求 `/Posts/Index`。
2.  **`PostsController`** 接到请求，调用 `_postService.GetAllPostsAsync()`。
3.  **`PostService`** 通过 `AppDbContext` (EF Core) 向 SQLite 数据库发送查询指令。
4.  **数据库**返回数据，被封装成 `List<Post>` 对象列表。
5.  **Controller** 把这个列表传给 `Views/Posts/Index.cshtml`。
6.  **View** 使用 `foreach` 循环遍历列表，生成 HTML 表格。
7.  **HTML** 最终发送回浏览器显示给你看。

---

## 🎓 下一步学习建议

如果你想利用这个项目练手，建议尝试以下挑战：

1.  **修改外观**：去 `wwwroot/css/site.css` 修改字体或颜色，或者在 `Views/Shared/_Layout.cshtml` 修改导航栏的文字。
2.  **增加字段**：试着给 `Post.cs` 模型增加一个 `Views` (浏览量) 字段。
    *   提示：修改 Model 后，记得运行 `dotnet ef migrations add AddViews` 和 `dotnet ef database update` 来更新数据库。
3.  **功能增强**：目前的评论是匿名的，试着修改代码，让已登录用户的评论自动显示他们的用户名。

祝你在 .NET 的学习之路上玩得开心！