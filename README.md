# MyNextBlog

> 基于 **.NET 10** 与 **Next.js 15** 构建的高性能、安全、现代化的全栈博客引擎。

MyNextBlog 是一个采用 **BFF (Backend for Frontend)** 架构设计的 Headless 内容管理系统。它旨在为开发者提供一个**生产级**的博客解决方案，在保持极简部署（Docker + SQLite）的同时，实现了企业级的性能优化与安全标准。

---

## ⚡️ 技术亮点 (Highlights)

### 架构与性能
*   **BFF 架构设计**: Next.js 作为安全的中间层，负责服务端渲染 (SSR) 与 API 转发，实现了彻底的前后端分离与 HttpOnly Cookie 认证。
*   **极致的查询优化**: 
    *   后端全面采用 `.AsNoTracking()` 禁用 EF Core 变更追踪，大幅降低内存开销。
    *   列表页查询采用 **Select 投影** 策略，仅传输前 200 字符摘要，数据载荷减少 **98%**。
*   **多级缓存策略**: 核心高频接口（首页、分类页）集成 **IMemoryCache**，实现毫秒级响应。
*   **轻量化部署**: 基于 **SQLite** 文件数据库与 **Docker** 容器化技术，无需复杂的中间件依赖即可一键启动。

### 安全与合规
*   **安全加固**: 已修复 Next.js/React 相关的 RCE 漏洞 (CVE-2025-*)，并配置了严格的 SSRF 防护策略。
*   **全局异常治理**: 集成 `GlobalExceptionMiddleware`，统一捕获未处理异常并标准化 JSON 响应，杜绝堆栈信息泄露。
*   **云原生存储**: 集成 Cloudflare R2 对象存储，支持图片资源与应用服务器分离，提升安全性与加载速度。

---

## 🛠 技术栈 (Tech Stack)

| 层级 | 核心技术 | 关键库/特性 |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 15** | App Router, Server Actions, SSR |
| | **UI System** | Tailwind CSS v4, shadcn/ui, Lucide React |
| | **Content** | React Markdown, Rehype Highlight |
| **Backend** | **.NET 10 (Preview)** | ASP.NET Core Web API |
| | **Data** | Entity Framework Core, SQLite |
| | **Logging** | Serilog (Structured Logging) |
| **DevOps** | **Docker** | Docker Compose, Multi-stage Builds |
| | **Storage** | Cloudflare R2 (S3 Compatible) |

---

## 🚀 快速启动 (Quick Start)

前提条件：请确保本地已安装 **Docker** 和 **Docker Compose**。

### 1. 配置环境变量
在项目根目录新建 `.env` 文件，填入必要的配置信息：

```env
# === 存储配置 (Cloudflare R2) ===
R2_SERVICE_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY=<YOUR_ACCESS_KEY>
R2_SECRET_KEY=<YOUR_SECRET_KEY>
R2_BUCKET_NAME=<BUCKET_NAME>
R2_PUBLIC_DOMAIN=https://<YOUR_CUSTOM_DOMAIN>

# === 安全配置 ===
JWT_SECRET=这里填入一个足够长的随机字符串作为密钥
JWT_ISSUER=MyNextBlogServer
JWT_AUDIENCE=MyNextBlogClient

# === 服务通信 (默认) ===
BACKEND_URL=http://backend:8080
```

### 2. 构建并运行
执行以下命令即可拉起完整环境：

```bash
docker compose up -d --build
```

启动完成后：
*   **前端访问**: `http://localhost:3000`
*   **后端 API**: `http://localhost:8080`
*   **Swagger 文档**: `http://localhost:8080/swagger`

### 3. 初始化权限
系统首次启动默认为空数据库。注册首个用户后，需通过数据库工具或命令行手动提升权限：

```sql
-- 将指定用户升级为管理员
UPDATE Users SET Role = 'Admin' WHERE Username = 'your_username';
```

---

## 📂 目录结构

```
/
├── backend/            # .NET 10 Web API 解决方案
│   ├── Controllers/    # API 控制器 (RESTful)
│   ├── Services/       # 业务逻辑与缓存实现
│   ├── Models/         # EF Core 实体定义
│   └── Data/           # 数据库上下文与迁移
├── frontend/           # Next.js 15 应用程序
│   ├── app/            # App Router 路由与页面
│   ├── components/     # UI 组件 (shadcn/ui)
│   └── lib/            # 工具函数与数据获取
├── data/               # SQLite 数据库持久化目录
└── docker-compose.yml  # 容器编排配置
```

---

## 📅 Future Roadmap (成熟度路线图)

目前项目处于 **v0.8** 阶段，核心功能完备且性能优异，但在运维体系和测试覆盖率上距离“生产级成熟产品”仍有差距。以下是迈向 v1.0 的规划：

### 🛠️ Phase 1: 稳固地基 (Stability & Ops)
- [ ] **自动化测试**: 引入 xUnit 为 `PostService` 等核心逻辑添加单元测试，确保重构不回退。
- [ ] **数据灾备**: 实现 SQLite 数据库的定时自动备份 (Cronjob)，并同步上传至 R2 存储桶。
- [ ] **健康检查**: 添加 `/health` 端点，配合 Docker Healthcheck 实现服务自动重启。
- [ ] **日志聚合**: 接入 Loki 或将 Serilog 落地为文件并轮转，便于排查生产环境问题。

### ✨ Phase 2: 功能补全 (Features & Polish)
- [ ] **评论增强**: 接入 Cloudflare Turnstile 验证码防刷，集成 SMTP 邮件通知。
- [ ] **动态配置**: 建立 `SystemSettings` 表，实现后台动态配置（如缓存时间、分页大小），拒绝硬编码。
- [ ] **资源治理**: 完善 R2 图片清理策略，实现“孤儿文件”的定期扫描与回收。
- [ ] **RSS/Atom**: 支持标准订阅源，方便 RSS 阅读器抓取。

### 📊 Phase 3: 可观测性 (Observability)
- [ ] **流量统计**: 集成 Umami 或自建简单的 PV/UV 统计面板。
- [ ] **性能监控**: 接入 OpenTelemetry，监控 API 响应耗时与内存泄漏风险。

---

## 📄 License

MIT License.
