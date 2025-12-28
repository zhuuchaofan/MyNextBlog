# 📝 内容管理系统架构 (Content Management System)

## 1. 核心概述

MyNextBlog 的内容管理系统围绕 **文章 (Post)** 的全生命周期展开，集成了 **权限控制 (RBAC)**、**资源管理 (Image Assets)** 和 **缓存策略**，旨在提供高效、安全且体验流畅的写作与阅读环境。

本文档详细说明了博客核心业务逻辑的实现细节，包括文章的增删改查 (CRUD) 流程和底层的权限设计。

---

## 2. 权限与认证体系 (Authentication & Authorization)

系统采用了基于 **JWT (Access Token) + Refresh Token** 的双令牌认证机制，结合 **BFF (Backend for Frontend)** 模式，兼顾了安全性与用户体验。

### 2.1 角色模型 (RBAC)

目前系统定义了两种角色：

- **User**: 普通注册用户。拥有评论、修改个人资料等权限。
- **Admin**: 管理员。拥有发布文章、管理评论、管理全站内容的最高权限。

### 2.2 令牌管理策略

- **Access Token**:
  - **格式**: JWT (包含 `ClaimTypes.Role`)。
  - **有效期**: 15 分钟 (短效，减少泄露风险)。
  - **存储**: HttpOnly Cookie (前端 JS 不可读，防御 XSS)。
- **Refresh Token**:
  - **格式**: 32 字节高熵随机数 (SHA-256 哈希后存储)。
  - **有效期**: 7 天。
  - **轮换机制 (Rotation)**:
    - 为了防止 "惊群效应" (Thundering Herd)，仅在剩余有效期不足 3 天时在刷新时进行轮换 (生成新 Token)。
    - 支持多设备登录：每个设备/会话拥有独立的 Refresh Token。
  - **安全重置**: 修改密码时，会强制废弃该用户所有设备的 Refresh Token，迫使全端重新登录。

---

## 3. 文章生命周期 (Post Lifecycle)

文章是系统的核心实体。其生命周期管理涉及多个关联服务的协同工作。

### 3.1 创建文章 (Create)

**API**: `POST /api/posts` (Admin Only)

1.  **标签处理**: 接收前端传来的标签字符串列表。`TagService` 负责 "Get Or Create" 逻辑 —— 如果标签已存在则复用 ID，不存在则创建。
2.  **默认值**: `CreateTime` 设为 UTC Now，`IsHidden` 默认为前端传入值。
3.  **持久化**: 将 `Post` 实体写入数据库。
4.  **资源关联 (关键)**: 调用 `IImageService.AssociateImagesAsync(postId, content)`。
    - 扫描正文 markdown，提取所有图片 URL。
    - 将这些图片在 `ImageAssets` 表中的记录与当前 `PostId` 绑定。
    - _目的_: 防止这些图片被僵尸图片清理任务误删。
5.  **缓存失效**: 清除所有列表页缓存 (`InvalidatePostListCache`)。

### 3.2 更新文章 (Update)

**API**: `PUT /api/posts/{id}` (Admin Only)

1.  **变更追踪**: 使用 `Include(p => p.Tags)` 加载原有实体，以便 EF Core 自动计算标签的增删。
2.  **更新逻辑**:
    - 更新基础字段 (Title, Content, CategoryId, ...)。
    - `UpdatedAt` 更新为 UTC Now。
    - 标签集合：先 Clear 再 Add 新集合，EF Core 会自动处理中间表的关联关系。
3.  **资源重关联**: 再次调用 `AssociateImagesAsync`。如果图片被从文章中移除，它们将失去关联，后续可能被清理任务回收。
4.  **缓存失效**: 清除缓存。

### 3.3 软删除与回收站 (Soft Delete)

系统采用 **软删除 (Soft Delete)** 机制，防止误操作。

- **删除 (Move to Trash)**:
  - **API**: `DELETE /api/posts/{id}`
  - **逻辑**: 设置 `IsDeleted = true`, `DeletedAt = UtcNow`。文章不再出现在前台列表中。
- **恢复 (Restore)**:
  - **API**: `POST /api/posts/{id}/restore`
  - **逻辑**: 重置 `IsDeleted = false`, `DeletedAt = null`。
- **永久删除 (Hard Delete)**:
  - **API**: `DELETE /api/posts/{id}/permanent`
  - **逻辑**:
    1. 调用 `IImageService.DeleteImagesForPostAsync`，物理删除关联的云端 (R2) 图片。
    2. 从数据库物理删除 `Post` 记录。

---

## 4. 读取与查询逻辑 (Read Flow)

为了应对高并发读取，服务层实现了分级缓存和精细的可见性过滤。

### 4.1 可见性过滤

`GetPostByIdAsync` 和 `GetAllPostsAsync` 都包含 `bool includeHidden` 参数：

- **Public API**: 默认 `includeHidden = false`。
  - SQL 过滤: `WHERE IsHidden = 0 AND IsDeleted = 0`。
- **Admin API**: 显式传入 `includeHidden = true`。
  - 能看到草稿和隐藏文章。

### 4.2 缓存策略 (Caching)

- **缓存层级**: 内存缓存 (`IMemoryCache`)。
- **缓存键**: `all_posts_{includeHidden}_{pageSize}`。
  - _注意_: 缓存 Key 必须包含 `pageSize`，以防首页 (PageSize=10) 和归档页 (PageSize=100) 混用导致数据不一致。
- **缓存内容**: 仅缓存 **第一页** 的数据。
  - _理由_: 90% 的流量集中在首页。缓存全量数据性价比低。
- **过期策略**:
  - **绝对过期**: 10 分钟。
  - **被动失效**: 任何增/删/改/显隐操作都会触发 `InvalidatePostListCache`，立即清除相关缓存。

### 4.3 列表查询优化

在 `GetAllPostsAsync` 中，为了避免 N+1 问题并减少传输数据量，使用了 **Projection (投影)** 技术：

```csharp
// 仅查询需要的字段，不加载整个 Post 实体
.Select(p => new PostSummaryDto(
    p.Id,
    p.Title,
    // 数据库端截取前 300 字符作为摘要预处理
    p.Content.Substring(0, 300),
    ...
))
```

此外，对于 **Markdown 封面图** 的提取，利用了 `MarkdownHelper.GetCoverImage` 方法在内存中从前 300 个字符中解析，避免了正则匹配全文的性能消耗。

---

## 5. 总结

| 模块     | 关键技术点                             | 优势                           |
| :------- | :------------------------------------- | :----------------------------- |
| **权限** | Access(15min) + Refresh(7d) + Rotation | 安全与体验平衡，支持多端登录   |
| **写入** | 自动关联图片资源 (AssociateImages)     | 防止图片孤儿化，自动化资源管理 |
| **读取** | 内存缓存(首页) + SQL 投影 + 软删除过滤 | 高性能，防止 N+1，数据安全     |
| **删除** | 软删除 -> 回收站 -> 物理删除           | 为用户提供"后悔药"             |
