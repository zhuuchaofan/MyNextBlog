# 项目架构与运维指南 (Architecture & Operations Guide)

本文档详细记录了 **MyTechBlog** (Headless .NET + Next.js) 的系统架构、配置细节及故障排查指南，旨在帮助开发者快速理解系统并处理常见问题。

---

## 1. 系统架构概览

本项目采用 **前后端分离 (Headless)** 架构，通过 Docker 容器化部署。

### 拓扑图
```mermaid
graph TD
    User[用户浏览器] -->|HTTPS / 域名访问| CFTunnel[Cloudflare Tunnel (宿主机)]
    
    subgraph Docker Host [宿主机 (Mac/Linux)]
        CFTunnel -->|localhost:3000| FrontendPort[端口 3000]
        CFTunnel -->|localhost:8080| BackendPort[端口 8080]
        
        subgraph Docker Network [Docker 内部网络]
            Frontend[前端容器: myblog-frontend]
            Backend[后端容器: myblog-backend]
        end
        
        FrontendPort --> Frontend
        BackendPort --> Backend
        
        Frontend --"SSR 请求 (http://backend:8080)"--> Backend
        Frontend --"API 代理转发 (/api/backend/*)"--> Backend
    end

    Backend -->|读写| DBFile[(SQLite: ./data/blog.db)]
    Backend -->|图片上传| R2[Cloudflare R2 Object Storage]
```

---

## 2. 详细配置说明

### A. 基础设施 (Docker & Environment)
*   **编排文件**: `docker-compose.yml`
    *   **网络**: 默认 Bridge 网络，服务间通过 `service name` (如 `backend`) 互访。
    *   **数据持久化**: 后端挂载宿主机 `./data` 目录到容器 `/app/data`，确保 SQLite 数据不丢失。
    *   **安全**: 敏感配置（R2 密钥、JWT 密钥）通过 `.env` 文件注入环境变量。
*   **密钥管理**: `.env` 文件（**未加入版本控制**）。

### B. 后端 (Backend / .NET 10)
*   **定位**: 纯 API 服务，提供数据和业务逻辑。
*   **关键文件**: `backend/Program.cs`, `backend/Controllers/Api/AuthController.cs`
*   **端口**: 容器内 `8080` -> 宿主机 `8080`。
*   **核心配置**:
    *   **CORS**: 配置了 `AllowNextJs` 策略，允许 `http://localhost:3000`, `https://nextblog...`, `https://blogapi...`。
    *   **Swagger**: 全环境开启，访问 `/swagger`。
    *   **JWT**: 使用 SymmetricSecurityKey 进行签名，有效期 7 天。
    *   **数据库**: 使用 SQLite，连接字符串由环境变量 `ConnectionStrings__DefaultConnection` 覆盖。

### C. 前端 (Frontend / Next.js 15)
*   **定位**: UI 渲染层 (SSR + Client Component)。
*   **关键文件**:
    *   `frontend/next.config.ts`: 配置 Proxy Rewrite。**关键逻辑**: `process.env.BACKEND_URL || 'http://backend:8080'` (优先 Docker 内部地址)。
    *   `frontend/app/posts/[id]/page.tsx`: 文章详情页 SSR。
    *   `frontend/components/Navbar.tsx`: 移动端适配导航栏。
    *   `frontend/components/MarkdownRenderer.tsx`: 封装 ReactMarkdown，支持 TOC 和代码复制。
*   **端口**: 容器内 `3000` -> 宿主机 `3000`。
*   **UI 库**: shadcn/ui + Tailwind CSS v4 + Lucide Icons。
*   **主要页面**:
    *   `/`: 现代化 Hero 区域 + 侧边栏布局。
    *   `/archive`: 垂直时间轴设计。
    *   `/gallery`: 瀑布流图片展示（Shadcn Dialog 灯箱）。
    *   `/about`: Notion 风格简历 + 技能树。
    *   `/login`: 左右分栏设计 + 动态背景。

---

## 3. 故障排查手册 (Troubleshooting)

如果系统出现异常，请遵循以下 **"三层排查法"**。

### 第一层：容器状态层 (Container Status)
**问题**: 网站无法访问，连接被拒绝。
*   **检查**: 运行 `docker compose ps`。
*   **判断**:
    *   状态必须为 `Up`。如果是 `Exited` 或 `Restarting`，说明容器崩溃。
    *   **行动**: 查看崩溃日志 `docker compose logs backend --tail 50`。常见原因：数据库连接失败、密钥缺失。

### 第二层：网络连接层 (Connectivity)
**问题**: 页面能打开，但显示“加载失败”或空数据。
*   **场景 A: 服务端渲染 (SSR) 失败**
    *   **现象**: 刷新页面直接报错，或服务端组件部分为空。
    *   **验证**: 进入前端容器测试连通性。
        ```bash
        docker compose exec frontend curl -I http://backend:8080/swagger/index.html
        ```
    *   **行动**: 如果不通，检查 `docker-compose.yml` 的网络配置或后端容器是否健康。

*   **场景 B: 客户端请求 (Client Fetch) 失败**
    *   **现象**: 页面加载后，交互（如评论、登录）报错，F12 看到 `ECONNREFUSED` 或 500。
    *   **排查**:
        *   **Next.js Proxy**: 检查 `next.config.ts` 中的 rewrite 规则是否正确指向后端容器名。
        *   **CORS**: 检查后端 `Program.cs` 是否允许了当前域名。
        *   **500 Error**: 后端代码报错，查看后端日志 (`docker compose logs backend`)。

### 第三层：配置与数据层 (Configuration & Data)
**问题**: 登录失效、上传报错、重启后数据丢失。
*   **检查密钥注入**:
    *   验证后端是否吃到了环境变量：
        ```bash
        docker compose exec backend env | grep Cloudflare
        ```
    *   **行动**: 如果为空，检查 `.env` 文件是否存在且格式正确，重跑 `docker compose up -d`。
*   **检查数据持久化**:
    *   **行动**: 检查宿主机 `data/blog.db` 是否存在且最后修改时间在更新。

---

## 4. 常用维护命令

```bash
# 启动/更新服务 (修改配置或代码后)
docker compose up --build -d

# 单独重启前端 (例如修改了 UI)
docker compose up --build -d frontend

# 停止服务
docker compose down

# 查看实时日志 (ctrl+c 退出)
docker compose logs -f

# 进入后端容器终端
docker compose exec backend /bin/bash

# 清理无用镜像
docker image prune -f
```