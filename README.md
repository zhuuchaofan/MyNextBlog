# MyNextBlog

> 基于 .NET 10 与 Next.js 16 构建的高性能、安全、现代化的全栈博客引擎。

MyNextBlog 是一个采用 **BFF (Backend for Frontend)** 架构设计的 Headless 内容管理系统，采用 Docker + PostgreSQL 架构，实现了企业级的性能优化与安全标准。

---

## 技术亮点

### 架构与性能

- **BFF 安全架构**: Next.js 作为中间层拦截 API 请求，实现 Token 隐身化 (HttpOnly Cookie)
- **Token 刷新防惊群**: Token 延迟轮换机制，解决多并发请求导致的用户意外登出问题
- **智能缓存**:
  - 前端 ISR (增量静态再生)，60 秒自动重验证
  - 后端内存缓存，权限隔离 + 即时失效
- **极致 DB 优化**: AsNoTracking + Select 投影 + PostgreSQL 物理索引

### 现代化体验

- **UI/UX**: Bento Grid 布局 + Dot Pattern 视觉主题 + Tailwind v4
- **系列文章**: 文章归类成系列，提供导航和目录功能
- **动态配置**: 首页文案等可通过后台动态修改
- **云原生**: Cloudflare R2 对象存储
- **RSS 订阅**: 内置标准 RSS 2.0 Feed 生成器

---

## 功能模块

### 核心博客

- Markdown 渲染 (GFM、代码高亮)
- 分类 / 标签 / 系列三层信息架构
- 文章状态机 (公开/隐藏)
- 全站深色模式

### 互动系统

- 评论 (无限级回复、邮件通知、敏感词过滤)
- 点赞 (Optimistic UI、多端同步)
- 一键分享

### 数字分身

- WakaTime 集成 (检测编程活动)
- Steam 集成 (检测游戏状态)
- 智能优先级: Manual Override > Coding > Gaming > Offline
- 导航栏状态展示 + Popover 详情

### 计划管理

- 日历视图 + 预算追踪
- 多日行程管理
- 邮件提醒 + 纪念日关联
- 公开分享链接

### 管理后台

- Dashboard 数据统计
- 文章 / 评论 / 用户管理
- 邮件模板可视化编辑
- API Key 配置管理

---

## 技术栈

| 层级     | 技术                                                                       |
| :------- | :------------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind v4, Shadcn/ui, Framer Motion |
| Backend  | .NET 10 (Minimal API), EF Core, JWT                                        |
| Database | PostgreSQL                                                                 |
| Storage  | Cloudflare R2                                                              |
| Deploy   | Docker Compose                                                             |

---

## 快速开始

```bash
# 克隆项目
git clone https://github.com/zhuuchaofan/MyNextBlog.git
cd MyNextBlog

# 启动服务
docker-compose up -d

# 访问
# 前台: http://localhost:3000
# 后台: http://localhost:3000/admin
```

---

## 文档

详细架构和开发文档请参阅 [docs/](./docs) 目录。

---

## 许可证

MIT License
