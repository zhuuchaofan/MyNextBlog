# MyNextBlog

> 基于 **.NET 10** 与 **Next.js 15** 构建的高性能、安全、现代化的全栈博客引擎。

MyNextBlog 是一个采用 **BFF (Backend for Frontend)** 架构设计的 Headless 内容管理系统。它旨在为开发者提供一个**生产级**的博客解决方案，采用 **Docker + PostgreSQL** 架构，实现了企业级的性能优化与安全标准。

---

## ⚡️ 技术亮点 (Highlights)

### 架构与性能

- **BFF 安全架构**: Next.js 作为中间层拦截 API 请求，实现了 **Token 隐身化** (HttpOnly Cookie)，彻底杜绝了 XSS 窃取 Token 的风险。
- **Token 刷新防惊群 (Thundering Herd Protection)**: 实现了 Token 延迟轮换机制 ("按需轮换"策略)，彻底解决了 Next.js 多并发请求导致的用户意外登出问题，即使用户 Token 过期也能平滑无感刷新。
- **智能缓存 (Smart Caching)**:
  - **前端 ISR (增量静态再生)**: 首页与详情页采用 Next.js ISR 策略，每 60 秒自动重验证。公开访问命中静态缓存，实现 CDN 级秒开体验。
  - **后端分层缓存**:
    - **内存缓存**: 针对高频的“纯净首页”请求，后端实现了毫秒级内存缓存。
    - **权限隔离**: 缓存 Key 严谨区分 (`all_posts_index_True`/`False`)，确保管理员看到的隐藏文章绝对不会因为缓存污染而泄露给普通用户。
    - **一致性**: 后端缓存支持即时失效，与前端 ISR 配合实现“最终一致性” (60s 延迟)。
- **极致 DB 优化**:
  - **AsNoTracking**: 全面禁用变更追踪，降低内存 60%+。
  - **Select 投影 & DTO**: 列表页仅查询必要字段（300 字摘要），并在内存中映射为 `PostSummaryDto`，杜绝了“截断实体”对领域模型的污染，同时极大减少 I/O 载荷。
  - **PostgreSQL**: 使用 PostgreSQL 作为主数据库，支持高并发读写和 JSONB 高级查询。
  - **物理索引**: 对 `IsHidden`, `CreateTime`, `ParentId` 等高频筛选字段建立了数据库索引。

### 现代化体验

- **UI/UX**: 全站统一采用了 "Bento Grid" (便当盒) 布局与 **"Dot Pattern" (点阵科技)** 视觉主题（含 Auth 页面），配合 Tailwind v4 实现极致视觉体验。
- **系列文章 (Series)**: 支持将相关文章组织成系列，提供系列导航、目录页和自动序号功能。
- **云原生**: 集成 Cloudflare R2 对象存储，实现代码与资源分离。
- **RSS 订阅**: 内置标准 RSS 2.0 Feed 生成器，方便阅读器聚合。

---

## 👥 权限与用户体系 (Permission & User System)

系统设计了极其精细的权限控制矩阵，覆盖了从游客到超级管理员的全生命周期。

### 1. 角色权限矩阵

| 功能模块           | 👤 游客 (Visitor) |    🧑 注册用户 (Member)    |      🛡️ 管理员 (Admin)       |
| :----------------- | :---------------: | :------------------------: | :--------------------------: |
| **浏览权限**       |  仅公开文章/评论  |      仅公开文章/评论       |    **所有** (含隐藏/草稿)    |
| **首页/分类/搜索** | 自动过滤隐藏文章  |      自动过滤隐藏文章      |  显示全部 (带 Hidden 标记)   |
| **系列页面**       |    仅公开文章     |         仅公开文章         |  显示全部 (带 Hidden 标记)   |
| **文章管理**       |        ❌         |             ❌             | ✅ (发布/编辑/软删除/回收站) |
| **评论权限**       | ✅ (需验证/审核)  |      ✅ (自动/免审\*)      |    ✅ (管理所有/批量操作)    |
| **点赞机制**       | ✅ (基于 IP 指纹) | ✅ (关联 UserID, 多端同步) |              ✅              |
| **用户中心**       |        ❌         |  ✅ (改名/换头像/修简介)   |          ✅ (同上)           |
| **媒体库**         |        ❌         |      ✅ (仅头像上传)       |    ✅ (文章配图/R2 管理)     |
| **后台访问**       |        ❌         |             ❌             |      ✅ (`/admin` 路由)      |

### 2. 用户生命周期 (User Lifecycle)

- **注册 (Registration)**:
  - 开放注册接口 `/api/auth/register`。
  - **强制邮箱验证**: 注册时必须提供有效邮箱，用于后续密码找回。
  - 密码安全：前端传输明文 -> 后端 **BCrypt** 加盐哈希存储 (WorkFactor=10)。
  - 默认角色：新注册用户默认为 `User` 角色，无后台访问权限。
- **登录 (Login)**:
  - 采用 **HttpOnly Cookie** 模式。
  - 流程：用户提交账号密码 -> Next.js 验证 -> 后端签发 JWT -> Next.js 将 JWT 写入浏览器 Cookie (不暴露给 JS) -> 跳转首页。
  - **会话互斥 (Single Session)**: 为确保账户安全，系统实行**单设备登录**策略。新设备登录会自动使旧设备的 Refresh Token 失效（即“顶号”机制），防止 Token 泄露后的长期风险。
- **找回密码 (Password Reset)**:
  - 流程：`/forgot-password` 提交邮箱 -> 后端生成 30 分钟有效的重置 Token -> 发送邮件 -> 用户点击链接进入 `/reset-password` -> 设置新密码。
  - 安全：Token 包含哈希签名，过期自动失效。
- **个人资料 (Profile)**:
  - **设置页面 (`/settings`)**: 提供完整的个人信息管理面板。
  - **支持字段**: 昵称 (`Nickname`)、职业 (`Occupation`)、所在地 (`Location`)、生日、个人简介 (`Bio`)、个人网站。
  - **即时更新**: 修改资料后，全局状态立即同步，无需刷新页面。
  - **头像上传**: 自动压缩并不经过服务器磁盘，直接流式上传至 Cloudflare R2。

---

## 🧩 功能模块深度解析 (Modules Deep Dive)

### 1. 📝 核心博客系统 (Blog Core)

- **SEO 最佳实践**:
  - 配置了 `metadataBase`，确保 Open Graph 分享链接的正确性。
  - 配置了 `metadataBase`，确保 Open Graph 分享链接的正确性。
  - 混合渲染策略：首页/详情页 (ISR) + 管理后台 (SSR) + 交互组件 (CSR)，利用 `generateMetadata` 动态生成文章标题和摘要。
- **Markdown 引擎**:
  - 基于 `react-markdown` 和 `rehype-highlight`。
  - 支持 GFM 标准表格、任务列表、代码块高亮。
- **分类体系 (三层信息架构)**:
  - **Category (分类)**: 文章的"主题领域"，互斥关系 (一篇只属于一个分类)。
  - **Tags (标签)**: 文章的"关键词特征"，非互斥 (如 ".NET", "Docker", "Tutorial")。
  - **Series (系列)**: 文章的"有序集合"，适合连载教程。
  - **UI 信息层次**: 首页卡片顶部显示分类+系列（定位信息），底部显示标签（特征信息）；详情页 Hero 区完整展示三者。

* **状态机**: 文章具备 `Active` (公开) / `Hidden` (隐藏) 状态。
  - **前台管理**: 管理员登录后，文章卡片会出现 "👁️" 切换按钮。
  - **极速响应**: 点击即时切换可见性 (Optimistic UI)，无需刷新页面。
  - **数据穿透**: 管理员身份会自动绕过 ISR 缓存，实时获取所有文章状态。
* **文章时效性 (UpdatedAt)**:
  - **修改时间记录**: 每篇文章除了 `CreateTime` 外，还记录 `UpdatedAt` 最后修改时间。
  - **前端展示**: 文章详情页 Hero 区域显示 "更新于 xxxx"，帮助读者判断内容时效性。
  - **SEO 优化**: 支持 sitemap `<lastmod>` 标签，提升搜索引擎排名。
* **系列文章 (Article Series)**:
  - **内容组织**: 将多篇相关文章归入同一系列（如 "Next.js 实战教程"）。
  - **系列导航**: 文章详情页底部自动显示系列信息和上一篇/下一篇链接。
  - **系列目录页**: 每个系列有独立的 `/series/[id]` 汇总页面，展示全部文章。
  - **动态序号计算**: 后端 `SeriesService` 实时计算文章在当前可见列表中的序号（Part X of Y），确保即使有中间文章被隐藏，前台展示的序号依然连续且正确。
  - **专用 API**: 后端提供 `GET /api/series/{id}/posts` 端点，避免前端过滤，支持权限控制。
  - **智能序号**: 新建文章时选择系列后，自动填入下一篇的序号。
  - **移动端优化**: 系列导航在移动端采用垂直堆叠布局，阅读更流畅。
* **全站深色模式 (Dark Mode)**:
  - 基于 `next-themes` 实现，完美适配系统设置。
  - 支持手动切换 (Light/Dark/System)，防止夜间阅读刺眼。

### 2. 💬 互动与评论 (Interaction)

- **极速点赞 (Optimistic UI)**:
  - 采用乐观更新策略，点击即反馈，后台异步同步数据。
  - **混合持久化**: 未登录用户使用 `localStorage` 记录状态，登录用户关联数据库账号，多端同步。
- **一键分享**:
  - 文章详情页支持一键复制链接 (PC) 或调用系统原生分享 (Mobile - Planned)。
- **无限级回复**:
  - 采用 `ParentId` 邻接表设计，理论上支持无限层级嵌套。
  - 前端自动递归渲染组件树。
  - **聊天气泡风格 (Chat Bubble UI)**:
    - 全新设计的现代化气泡布局，视觉聚焦内容本身。
    - 完美的圆角与留白处理，提升阅读舒适度。
  - **智能防风控 (Anti-Spam)**:
    - **频率限制**: 内存级滑动窗口算法，限制单 IP 60 秒内仅能发布 1 条评论。
    - **敏感词过滤**: 内置敏感词库，匹配成功后评论自动标记为 `IsApproved=false`，需人工审核通过后才会显示。
- **邮件通知**:
  - 当评论被回复时，自动发送邮件通知原作者（支持 SMTP 配置）。
- **移动端体验优化 (Mobile Experience)**:
  - **拇指友好 (Thumb-friendly)**: 新增底部悬浮栏 (Sticky Bar)，集成写评论(自动聚焦)、点赞、分享功能。
  - **智能布局**:
    - 评论区在移动端自动切换为 "上下堆叠" 布局，防止信息拥挤。
    - 优化缩进算法，避免深层回复导致 "排版崩坏"。
    - 键盘自动对焦优化，点击输入框平滑滚动。

### 3. 🖼️ 云原生媒体中心 (Cloud Media)

- **Next.js Image 优化**:
  - `next.config.ts` 已配置 `remotePatterns` 白名单，仅允许 R2 和 DiceBear 域名。
  - 利用 Next.js 自动生成 `srcset`，根据设备屏幕实现响应式图片加载，大幅节省带宽。
- **架构**:
  - 彻底告别本地 `wwwroot/uploads` 目录。
  - 所有图片（头像、文章配图）直接流式上传至 **Cloudflare R2** (S3 兼容)。
- **智能关联 (Smart Binding)**:
  - **问题**: 用户上传了图片但最后没发文章，导致由于“僵尸图片”占用云存储空间。
  - **方案**:
    1.  图片上传时标记为 `Unbound`。
    2.  文章发布/更新时，后台扫描 Markdown 内容，解析所有图片 URL。
    3.  将匹配到的图片资源标记为 `Bound` 并关联 `PostId`。
    4.  后台服务定期清理 `Unbound` 且超过 24 小时的图片。
- **安全加固 (Security Hardening)**:
  - **严格的文件校验**: `UploadController` 强制执行 `Image.IdentifyAsync` 深度文件头检查，确保上传的二进制数据确实是有效图片。这比单纯检查文件扩展名安全得多，能有效防御 WebShell 伪装攻击。

### 4. 📊 RSS 订阅 (Feed)

- **标准支持**: 自动生成符合 `RSS 2.0` 标准的 XML 文件。
- **路由**: `/feed.xml`。
- **包含内容**:
  - 最近 20 篇公开文章。
  - 包含全文摘要、发布时间、作者信息。

* 兼容 Feedly, Reeder 等主流阅读器。

### 5. 🔍 搜索与归档 (Search & Archive)

- **全局搜索**:
  - 前端集成 CMD+K 快捷键唤起搜索框。
  - 支持针对 标题、标签、摘要 的模糊检索。
- **时间轴归档**:
  - 按年份/月份自动聚类文章，方便追溯历史内容。

### 6. ⚙️ 超级管理后台 (Admin Dashboard)

- **仪表盘**: 可视化展示文章总数、评论总数、待审核数量。
- **系列管理**:
  - 专用 `/admin/series` 页面，支持系列的创建、编辑、删除。
  - 显示每个系列包含的文章数量。
  - 删除系列时提示受影响的文章数量，防止误操作。
  - 移动端采用卡片视图，与评论管理风格一致。
- **内容审计**:
  - 专用的评论审核队列。
  - 支持一键 "✅ 通过" 或 "🗑️ 删除"。
  - **移动端优化**:
    - **卡片视图**: 自动切换为 Card View，适配手机窄屏。
    - **悬浮操作栏**: 多选时底部弹出批量操作条，不遮挡内容。
    - **交互统一**: 修正了分页按钮顺序，统一了所有管理页面的头部导航。
- **文章列表增强**:
  - 文章管理列表显示所属系列信息（`#序号 系列名`）。
  - 编辑文章时可选择/修改所属系列，支持自动填入序号。
- **回收站 (Trash)**:
  - **软删除机制**: 删除文章时设置 `IsDeleted=true` 而非物理删除，保留恢复可能。
  - **回收站页面**: `/admin/trash` 提供已删除文章列表、恢复和永久删除操作。
  - **永久删除**: 物理删除记录并清理关联的云端图片资源。
  - **安全过滤**: 所有公开查询自动排除已删除文章。
- **配置中心**:
  - (WIP) 支持在线修改网站标题、SEO 关键词。

### 7. 🛡️ 运维自动化 (Ops Automation)

- **数据库自动备份**:
  - 内置 `DatabaseBackupService` (HostedService)，无需配置 Crontab。
  - **机制**: 每天凌晨自动将 `blog.db` 文件热备份并上传至 Cloudflare R2 的 `/backups` 目录。
  - **高可用**: 即使服务器彻底宕机，也能从云端恢复最近一次的数据。
- **数据播种 (Seeding)**:
  - 首次启动时，`DataSeeder` 会自动初始化默认分类 (`Technology`, `Life`) 和系统配置，实现开箱即用。

---

## 🔮 未来规划 (Roadmap)

- [ ] **流量统计 (Analytics)**:
  - 计划集成 **Google Analytics 4** 或 **Vercel Analytics**，补充缺失的访客行为数据。
  - 目前仅有 Search Console 的搜索点击数据。
- **移动端体验升级**:
  - [ ] **原生分享**: 适配移动端 `navigator.share` API，调用系统级分享菜单。
  - [x] **PWA 支持**: 已添加 `manifest.json`，支持添加到主屏幕，提供类原生 App 体验。
- **内容增强**:
  - [ ] **全文 RSS**: 目前 RSS 仅输出摘要，计划增加配置项支持全文输出。
  - [ ] **AI 摘要**: 利用 LLM 自动为长文章生成 TL;DR 摘要。
  - [ ] **系列批量管理**: 在系列管理页面支持直接选择文章加入系列，实现批量添加和拖拽排序。
- **游客友好功能 (Visitor Experience)**:
  - [ ] **相关文章推荐**: 文章末尾推荐同分类/同标签的其他文章，提高留存。
  - [ ] **划词评论**: 类似 Medium，选中某段文字可直接评论，增强互动性。
  - [ ] **AI 问答**: 基于文章内容的 Q&A 对话，用户可向文章提问。
- **架构升级 (Architecture 2.0)**:
  - [x] **PostgreSQL 迁移**: 已从 SQLite 迁移到 PostgreSQL，支持更高的并发写入和 JSONB 高级查询。
  - [ ] **Redis 缓存**: 引入 Redis 替代内存缓存，实现分布式缓存和持久化，解决重启后缓存失效问题。
  - [x] **Security Audit**: Completed comprehensive code review for Production Readiness.
  - [x] **UpdatedAt 字段**: 为文章添加了最后修改时间字段，完善内容时效性追踪。
  - [ ] **GitHub OAuth**: 实现 GitHub 账号快捷登录 (WIP)。
  - [ ] **Admin Initialization**: 实现 "First-User Policy"，首个注册用户自动提权为管理员，免去 SQL 操作。

### 2025 战略评估 (Strategic Assessment)

> "基准线以上，惊喜线以下"

- **现状**: 代码规范，选型新 (.NET 10/Next 15)，无安全漏洞。
- **挑战**: 缺乏核心竞争力与智能化特性。
- **北极星指标 (North Star)**:
  - [ ] **AI 增强**: 引入 **Vector Database** (向量数据库) 实现语义搜索。
  - [ ] **可观测性**: 引入 **OpenTelemetry** 实现全链路追踪。
  - [ ] **工程化**: 完善 CI/CD 与自动化测试覆盖率。

---

## 🛠 技术底层 (Tech Stack)

| 领域         | 核心技术       | 详细说明                                                                             |
| :----------- | :------------- | :----------------------------------------------------------------------------------- |
| **Frontend** | **Next.js 15** | 使用 App Router 架构，结合 Server Actions 处理表单提交。                             |
|              | **Typescript** | 全面强类型覆盖，前后端共享 DTO 定义。                                                |
|              | **UI System**  | Tailwind CSS v4 (原子化 CSS) + shadcn/ui (无头组件库) + Framer Motion (动画)。       |
|              | **Config**     | `next.config.ts` 配置了 `standalone` 模式 (Docker 优化) 和 API Rewrites (反向代理)。 |
| **Backend**  | **.NET 10**    | 抢先体验版 ASP.NET Core Web API，使用 Minimal APIs 风格。                            |
|              | **EF Core**    | Code-First, 自动 Migrations & Seeding。                                              |
|              | **PostgreSQL** | 主数据库，支持高并发和复杂查询。                                                     |
|              | **Services**   | MemoryCache, Serilog, Automapper, HostedServices (Backups)。                         |
|              | **Serilog**    | 结构化日志，支持输出到 Console, File 或 Elasticsearch。                              |
| **DevOps**   | **Docker**     | 多阶段构建 (Multi-stage Build)，最终镜像仅 80MB+。                                   |

---

## 🚀 快速启动 (Quick Start)

**前提**: 本地已安装 `Docker` 和 `Docker Compose`。

### 1. 配置环境

新建 `.env` 文件：

```env
# R2 存储配置 (必填，否则无法上传图片)
R2_SERVICE_URL=https://<ID>.r2.cloudflarestorage.com
R2_ACCESS_KEY=<KEY>
R2_SECRET_KEY=<SECRET>
R2_BUCKET_NAME=<BUCKET>
R2_PUBLIC_DOMAIN=https://img.yourdomain.com

# 邮件配置 (选填，不填则不发邮件)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app_password

# JWT 安全配置
JWT_SECRET=YourSuperSecretKeyShouldBeLongEnough
JWT_ISSUER=MyNextBlogServer
JWT_AUDIENCE=MyNextBlogClient

# 应用域名 (用于生成重置密码链接)
AppUrl=http://localhost:3000
```

### 2. 一键运行

```bash
docker compose up -d --build
```

启动后访问：

- 前端 (Blog): `http://localhost:3000`
- 后端 (API): `http://localhost:8080`
- API 文档: `http://localhost:8080/swagger`

### 3. 提升管理员

### 3. 提升管理员 (Promote to Admin)

目前采用临时方案，需手动修改数据库。

> **注意**: 这种手动操作 **不符合生产环境最佳实践**。
> 未来计划引入 **"First User Policy"** (首个注册用户自动成为管理员) 或 **CLI Seeding Tool** 以优化体验。

```bash
# 进入数据库容器执行 SQL (PostgreSQL)
# 注意：表名和字段名在 PostgreSQL 中区分大小写，需加双引号
docker compose exec db psql -U blog_admin -d my_blog -c "UPDATE \"Users\" SET \"Role\" = 'Admin' WHERE \"Username\" = '你的用户名';"
```

---

## 📂 目录结构图

```text
/
├── backend/                # .NET 10 Web API
│   ├── Controllers/        # 无逻辑控制器 (Thin Controllers)
│   ├── Services/           # 业务逻辑核心 (Rich Services)
│   ├── Data/               # 数据库上下文与迁移
│   ├── DTOs/               # 数据传输对象 (Data Transfer Objects)
│   └── Extensions/         # 中间件与扩展 (GlobalException, Swagger)
├── frontend/               # Next.js 15 App
│   ├── app/                # 路由: (public), (admin), (auth)
│   ├── components/         # UI组件: Button, Card, Dialog
│   ├── context/            # 全局状态: AuthContext
│   └── lib/                # 工具: api.ts (BFF Client), utils.ts
├── docker-compose.yml      # 开发环境编排
└── README.md               # 项目文档
```

---

## 📄 License

MIT License.
