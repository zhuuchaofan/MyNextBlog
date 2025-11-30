# MyTechBlog - 现代化的 .NET 10 个人技术博客系统

欢迎来到 **MyTechBlog**！这是一个基于 **ASP.NET Core (.NET 10)** 构建的全栈 Web 应用示例。它不仅是一个功能完备的个人博客，更是一个展示现代 Web 开发最佳实践的教学项目。

本项目展示了如何将 **MVC 架构**、**云存储 (Cloudflare R2)**、**智能资源管理**以及**极致的前端体验**完美融合。

---

## ✨ 核心亮点

### 1. 极致的写作体验 ✍️
*   **Markdown 支持**: 内置 Markdig 解析引擎，支持标准语法。
*   **Mermaid 图表**: 直接在文章中绘制流程图、时序图、甘特图。
*   **全方位图片上传**:
    *   **粘贴上传**: 截图后直接 `Ctrl+V`，自动上传并插入 Markdown。
    *   **拖拽上传**: 直接将图片文件拖入编辑器。
    *   **点击上传**: 传统文件选择方式。
*   **前端性能优化**: 内置 `compressorjs`，在上传前自动将图片压缩为 **WebP** 格式（一种更现代、体积更小的图片格式），实现秒传且节省流量。
*   **交互反馈系统 (User Feedback System)**:
    *   **实时状态提示 (Toasts)**: 无论你在做什么操作（压缩中、上传中、成功），页面右上角都会弹出一个小卡片（Toast）告诉你当前进度，不用对着屏幕干着急。
    *   **批量上传与汇总**: 
        *   支持一次性拖拽多张图片（比如把一个文件夹里的图全拖进去）。
        *   系统会自动排队处理，全部完成后会生成一份体检报告：“上传完成：成功 10 张，失败 0 张”。
    *   **安全熔断机制**: 为了防止浏览器卡死，系统限制单次最多上传 **50 张**图片。超过这个数量会直接提示错误，保护你的写作现场。
    *   **智能错误处理**: 如果某张图片上传失败，编辑器内会显示 `![加载失败 - 请重试]()`，让你一眼就能看到哪张图出了问题。

### 2. 智能资源管理 (Smart Asset Management) 🧠
*   **云端存储**: 图片直接上传至 **Cloudflare R2** 对象存储，不占用服务器空间。
*   **引用追踪**: 数据库 (`ImageAssets` 表) 精确记录每一张图片的归属文章。
*   **自动垃圾回收**:
    *   **级联删除**: 删除文章时，自动**物理删除**云端对应的所有图片文件。
    *   **僵尸清理**: 提供管理接口，一键清理那些“上传了但未保存”的垃圾图片。

### 3. 极简用户系统 🛡️
*   **自动赋权**: 系统会自动将**第一位注册的用户**识别为**管理员 (Admin)**，后续注册用户默认为普通访客。
*   **安全认证**: 使用 BCrypt 加密存储密码，基于 Cookie 进行身份验证。
*   **文章隐藏与草稿管理**:
    *   管理员可以在创建或编辑文章时设置 **隐藏状态 (Hidden)**。
    *   隐藏的文章在列表中对管理员显示“已隐藏”标记，方便管理草稿或下架内容。
    *   普通用户无法在列表中看到隐藏文章，也无法通过 URL 直接访问（返回 404），确保内容安全。
*   **作者归属**: 每篇文章都会自动记录并显示作者（发布者）名称，支持多用户协作场景。

### 4. 优秀的阅读体验 📖
*   **分类筛选**: 点击文章列表或详情页中的分类徽章，即可快速筛选查看该分类下的所有文章。
*   **表格优化**: 针对 Markdown 表格进行了专门的 CSS 美化（边框、斑马纹），确保技术文档中的数据清晰易读。
*   **懒加载 (Lazy Loading)**: 图片仅在滚动可见时加载。
*   **Lightbox**: 点击图片可全屏无损查看大图。

---

## 🛠 技术栈架构

本项目采用分层架构设计，职责分离清晰：

*   **框架**: .NET 10 (ASP.NET Core MVC)
*   **数据库**: SQLite (Entity Framework Core Code-First)
*   **云存储**: Cloudflare R2 (通过 AWS S3 SDK 对接)
*   **前端**: Bootstrap 5 + Vanilla JS (无繁重框架)
*   **关键库**:
    *   `Markdig`: Markdown 解析
    *   `AWSSDK.S3`: 对象存储交互
    *   `Compressor.js`: 前端图片压缩

### 项目结构解析

| 目录 | 说明 | 核心职责 |
| :--- | :--- | :--- |
| `Controllers/` | 控制器层 | 处理 HTTP 请求，调度服务，返回视图。**关键**: `UploadController` (图片上传), `PostsController` (博客管理)。 |
| `Services/` | 业务逻辑层 | **核心大脑**。`PostService` (文章逻辑), `ImageService` (图片生命周期管理), `R2StorageService` (云存储对接)。 |
| `Models/` | 数据模型 | 定义数据库表结构 (`Post`, `ImageAsset`, `User` 等)。 |
| `Views/` | 视图层 | Razor 页面模板。`Details.cshtml` 包含 Mermaid 渲染和 Lightbox 逻辑。 |
| `wwwroot/js/` | 前端脚本 | `site.js` 实现了拖拽/粘贴上传和 WebP 压缩逻辑。 |

---

## 🚀 快速开始

### 环境准备
确保已安装 **.NET 10 SDK**。

### 1. 配置云存储 (Cloudflare R2)
打开 `appsettings.json`，配置你的 R2 存储桶信息：
```json
"CloudflareR2": {
    "ServiceUrl": "https://<ACCOUNT_ID>.r2.cloudflarestorage.com",
    "AccessKey": "<YOUR_ACCESS_KEY>",
    "SecretKey": "<YOUR_SECRET_KEY>",
    "BucketName": "<YOUR_BUCKET_NAME>",
    "PublicDomain": "https://<YOUR_CUSTOM_DOMAIN>"
}
```

### 2. 初始化数据库
运行以下命令生成 SQLite 数据库文件 (`blog.db`)：
```bash
dotnet ef database update
```

### 3. 启动项目
```bash
dotnet run
```
访问 `http://localhost:5000`，注册第一个账号，开始你的博客之旅！

---

## 🔍 深度功能解析

### 图片上传全流程
1.  **前端捕获**: 监听 `paste` / `drop` / `change` 事件。
2.  **前端压缩**: `Compressor.js` 将图片转为 Quality 0.8 的 WebP。
3.  **即时反馈**: 编辑器插入 `![图片上传中...](ID)` 占位符。
4.  **后端处理**: 
    *   `UploadController` 接收流。
    *   `R2StorageService` 上传至 R2。
    *   `ImageService` 在数据库创建一条 `PostId=null` 的孤儿记录。
5.  **回填**: 前端收到 URL，替换占位符。

### 垃圾回收机制
当你在写文章时上传了图片，但最后取消了发布，这张图片就变成了“僵尸”。
*   **手动清理**: 管理员可调用 API 接口 `POST /api/upload/cleanup`。
*   **逻辑**: 系统查找所有 `PostId` 为空且上传超过 24 小时的记录，从 R2 删除文件并清除数据库。

---

## 🤝 贡献与学习建议
本项目非常适合作为 .NET 入门实战教材。你可以尝试以下挑战：
1.  **搜索功能**: 给博客添加一个搜索框，支持标题和内容搜索。
2.  **RSS 订阅**: 生成 `rss.xml` 供阅读器订阅。
3.  **暗黑模式**: 利用 Bootstrap 5 的 Dark Mode 支持实现主题切换。

Enjoy coding! 🚀
