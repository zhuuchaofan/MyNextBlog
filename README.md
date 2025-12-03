# MyTechBlog - 现代化的 .NET 10 个人技术博客系统

欢迎来到 **球球布丁的后花园 (Fan's Tech Blog)**！这是一个基于 **ASP.NET Core (.NET 10)** 构建的全栈 Web 应用示例。它不仅是一个功能完备的个人博客，更是一个展示现代 Web 开发最佳实践的教学项目。

本项目展示了如何将 **MVC 架构**、**云存储 (Cloudflare R2)**、**智能资源管理**以及**极致的前端体验**完美融合。

## 📅 更新日志 (Update Log)

### 2025-12-03 (Next.js): 彻底前后端分离 - 第一阶段 (Read-Only) ✅
我们成功迈出了从 MVC 向 Headless 架构转型的关键一步！
*   **前端重生 (Next.js 15)**:
    *   在 `client` 目录下初始化了全新的前端项目。
    *   **技术栈**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui。
    *   **现代化 UI**: 实现了带毛玻璃效果的导航栏、Hero 欢迎区、卡片式文章列表。
    *   **移动端适配**: 完美解决了移动端访问 Localhost API 失败的问题（通过 `next.config.ts` 配置反向代理）。
*   **后端改造 (.NET 10)**:
    *   配置了 **CORS**，允许前端跨域请求。
    *   虽然主要流量现在通过 Next.js 代理转发，但 CORS 为未来的独立部署做好了准备。
*   **核心功能**:
    *   **首页**: 展示文章列表（动态从 API 获取）。
    *   **详情页**: 实现了 Markdown 的服务端渲染 (SSR)，支持代码高亮和 GitHub 风格样式。

### 2025-12-03 (深夜): Phase 2 完美收官 - 混合架构就绪
*   **API 覆盖率达到 90%**: 完成了核心的 **只读 API** (文章列表、详情、评论浏览) 和 **认证 API**。
*   **架构状态**: 项目正式进入 "Hybrid State"（混合态）。
    *   **MVC 端**: 继续负责完整的后台管理（写文章、传图片）。
    *   **API 端**: 已准备好为即将启动的 Next.js 前端提供数据服务。
*   **下一步**: 启动 Phase 3，初始化 Next.js 项目，优先构建只读版的前端体验。

### 2025-12-03: 前端布局优化与修复
*   **UI 结构性修复**:
    *   **移动端导航菜单 (Offcanvas)**: 修复了移动端侧滑菜单的嵌套错误，将其从导航栏中移出，确保全屏高度显示。
    *   **文章编辑/创建页**: 修复了 `Create.cshtml` 和 `Edit.cshtml` 中 `div` 标签的闭合错误，确保页面结构正确。
*   **前端布局与响应式优化**:
    *   **文章摘要显示**: 引入 CSS `line-clamp` 技术，使文章列表页的摘要统一截断为 3 行，提升移动端列表的整齐度和美观性。
    *   **桌面端导航回归**: 修复了因结构调整导致桌面端导航菜单消失的问题。

### 2025-12-03 (晚间): 架构升级 - 迈向前后端分离 (Phase 2 Kick-off)
为了实现 **"Hybrid to Headless"** 的演进目标，我们完成了后端基础设施的关键改造：
*   **双重认证体系 (Dual Auth)**: 
    *   **Cookie**: 继续服务于现有的 MVC 页面（浏览器端）。
    *   **JWT (JSON Web Token)**: 新增了 JWT 认证支持，并实现了 `POST /api/auth/login` 接口。
*   **API 文档化 (Swagger)**: 引入并配置了 **Swagger UI**。
*   **内容 API (Posts API)**: 完成了 `PostsApiController`，支持分页、搜索、分类过滤。

---

## ✨ 核心亮点 (Features)

### 1. Headless 前端体验 (New!) 🚀
*   **极速加载**: 利用 Next.js 的服务端组件 (RSC) 和流式渲染，首屏瞬间可见。
*   **现代化设计**: 基于 `shadcn/ui` 的设计语言，简洁、优雅、响应式。
*   **无缝衔接**: 手机、电脑访问体验一致，自动处理 API 代理。

### 2. 极致的写作体验 ✍️
这里是为了让你写博客像写代码一样流畅：
*   **Markdown 支持**: 内置 **Markdig** 引擎。
*   **全方位图片上传**: 粘贴上传、拖拽上传。
*   **前端性能优化**: `compressorjs` 自动压缩图片为 WebP。

### 3. 智能资源管理 (Smart Asset Management) 🧠
*   **云端存储 (Cloudflare R2)**: 图片存云端，轻量化服务器。
*   **自动垃圾回收**: 删除文章自动清理图片，清理“僵尸”上传。

### 4. 极简用户系统 🛡️
*   **自动赋权**: 第一个注册即管理员。
*   **安全认证**: BCrypt 密码加密 + JWT/Cookie 双重认证。

---

## 🛠 技术栈架构 (Tech Stack)

现在我们是 **双栈 (Dual Stack)** 架构：

### 1. 后端 (Backend) - The Core
*   **Framework**: .NET 10 (ASP.NET Core API)
*   **Database**: SQLite + Entity Framework Core
*   **Storage**: Cloudflare R2 (S3 Compatible)
*   **Auth**: JWT + Cookie

### 2. 前端 (Frontend) - The Face
*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS v4 + shadcn/ui
*   **Rendering**: Server-Side Rendering (SSR)

---

## 🚀 快速开始

### 环境准备
确保已安装 **.NET 10 SDK** 和 **Node.js 20+**。

### 1. 启动后端
```bash
dotnet run
# 后端运行在 http://localhost:5095 (或 5000)
```

### 2. 启动前端
```bash
cd client
npm run dev
# 前端运行在 http://localhost:3000
```

访问 `http://localhost:3000` 即可看到全新的博客界面！

---

## 🎨 设计哲学与技术演进 (Design & Architecture Manifesto)

### 阶段 3: 彻底分离 (Headless Evolution - 进行中 🚧)
*   **Stage 3.1: 只读前端 (MVP) [已完成 ✅]**
    *   Next.js 项目初始化。
    *   首页、文章详情页渲染。
    *   API 代理配置 (解决移动端访问问题)。
*   **Stage 3.2: 写操作 API 补全 [TODO]**
    *   补全 `Create/Update Post` API。
    *   改造 `UploadController` 以支持 JWT 验证。
*   **Stage 3.3: 管理后台迁移 [TODO]**
    *   在 Next.js 中实现基于 JWT 的登录与权限管理。
    *   移植 Markdown 编辑器。

Enjoy coding! 🚀