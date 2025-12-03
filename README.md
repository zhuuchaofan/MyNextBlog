# MyTechBlog - 现代化的 .NET 10 个人技术博客系统

欢迎来到 **球球布丁的后花园 (Fan's Tech Blog)**！这是一个基于 **ASP.NET Core (.NET 10)** 和 **Next.js 15** 构建的现代化全栈 Web 应用。它完美融合了硬核的后端技术与极致的前端交互体验。

## 📅 更新日志 (Update Log)

### 2025-12-04 (Next.js Admin): 管理后台前端化 (Phase 3.2 Complete) ✅
我们成功将管理后台从传统的 MVC 迁移到了 Next.js，实现了**100% 前后端分离**！
*   **全功能后台 (`/admin`)**:
    *   **仪表盘**: 现代化的卡片式布局，直观展示快捷入口。
    *   **身份认证**: 基于 **JWT** 的安全登录系统，支持 Token 持久化与自动续期。
    *   **RBAC 权限控制**: 只有 Admin 角色才能进入后台，普通用户会被自动拦截。
*   **文章管理 (CMS)**:
    *   **所见即所得**: 自研 **Markdown 编辑器**，支持分栏预览、快捷工具栏。
    *   **无感上传**: 支持直接 **粘贴 (Ctrl+V)** 或 **拖拽** 图片到编辑器，自动上传至 R2 并插入 Markdown 链接。
    *   **CRUD 闭环**: 实现了文章的发布、列表查看、编辑回显、删除（带安全确认弹窗）全流程。
*   **体验升级**:
    *   **Toast 通知**: 全面引入 `sonner`，用优雅的 Toast 替代了原生 Alert。
    *   **交互优化**: 按钮 Loading 态、模态框确认、骨架屏加载，细节拉满。

### 2025-12-03 (Next.js Public): 访客端分离 (Phase 3.1) ✅
*   **前端重生**: 初始化 Next.js 15 (App Router) + Tailwind CSS v4 + shadcn/ui 项目。
*   **核心功能**: 首页、详情页 (SSR)、关于页、归档页、分类筛选、评论系统全部上线。
*   **移动端适配**: 通过 API Proxy 完美解决了 Safari/移动端访问 Localhost API 的问题。

### 2025-12-03 (Backend): 混合架构基石 (Phase 2) ✅
*   **API First**: 完成了 Posts, Comments, Auth, Categories, Upload 等全套 API。
*   **安全基石**: 实现了 JWT + Cookie 双重认证，CORS 跨域配置。
*   **文档化**: 集成 Swagger UI (`/swagger`)。

---

## ✨ 核心亮点 (Features)

### 1. Headless 前端 (Next.js) 🚀
*   **双端体验**: 访客端追求极致性能 (SSR/ISR)，管理端追求极致交互 (CSR)。
*   **现代化设计**: 统一采用 **"温馨现代主义"** 设计语言，毛玻璃、圆角、动态渐变背景。
*   **无缝衔接**: 手机、电脑访问体验一致。

### 2. 极致的写作体验 ✍️
*   **Markdown 编辑器**: 内置于 Next.js 后台，支持实时预览。
*   **智能图床**: 粘贴/拖拽图片自动上传 Cloudflare R2，无需第三方工具。
*   **代码高亮**: 支持 GitHub 风格的代码块高亮。

### 3. 智能资源管理 🧠
*   **云端存储**: 所有媒体资源托管在 R2 对象存储。
*   **自动清理**: 删除文章时自动清理关联图片，防止资源浪费。

### 4. 极简而强大的权限 🛡️
*   **自动赋权**: 第一个注册用户自动成为管理员。
*   **双重守卫**: API 层有 `[Authorize]` 守卫，前端路由有 `AuthContext` 守卫。

---

## 🛠 技术栈架构 (Tech Stack)

本项目采用 **双栈 (Dual Stack)** 分离架构：

### 1. 后端 (Backend) - The Core
*   **Framework**: .NET 10 (ASP.NET Core Web API)
*   **Database**: SQLite + Entity Framework Core
*   **Storage**: Cloudflare R2 (S3 Compatible)
*   **Auth**: JWT (for API) + Cookie (legacy)

### 2. 前端 (Frontend) - The Face
*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS v4 + shadcn/ui
*   **State**: React Context (Auth) + SWR-like fetching
*   **Feedback**: Sonner (Toast)

---

## 🚀 快速开始

### 环境准备
确保已安装 **.NET 10 SDK** 和 **Node.js 20+**。

### 1. 启动后端 (API Server)
```bash
dotnet run
# 后端运行在 http://localhost:5095 (或 5000)
# Swagger 文档: http://localhost:5095/swagger
```

### 2. 启动前端 (Next.js Client)
```bash
cd client
npm run dev
# 前端运行在 http://localhost:3000
```

### 3. 访问指南
*   **访客首页**: `http://localhost:3000`
*   **管理后台**: `http://localhost:3000/admin` (需要登录)
    *   点击右上角“登录”按钮，使用管理员账号登录。

---

## 🎨 设计哲学与未来规划

我们已经完成了 **"Hybrid to Headless"** 的华丽转身。
目前的架构已经非常成熟，可以支撑从个人博客到小型 CMS 的各种需求。

### 待办事项 (Roadmap)
*   [ ] **SEO 优化**: 为 Next.js 配置 Metadata API，生成 sitemap.xml。
*   [ ] **暗黑模式**: 适配 shadcn/ui 的 Dark Mode。
*   [ ] **部署**: 编写 Dockerfile，实现一键部署。

Enjoy coding! 🚀
