# 🔧 技术债务与重构状态

> 本文档记录项目中待完成的技术债务和重构任务的进度。

---

## DTO 映射重构状态

### 📅 开始时间

2025-12-27

### 🎯 目标

将分散在各处的手动 DTO 构造代码统一为扩展方法，减少重复代码，提高可维护性。

### ✅ 已完成

| 文件                                  | 方法             | 说明                      |
| :------------------------------------ | :--------------- | :------------------------ |
| `Extensions/PostMappingExtensions.cs` | `ToSummaryDto()` | 文章摘要 DTO 映射         |
| `Extensions/PostMappingExtensions.cs` | `ToDetailDto()`  | 文章详情 DTO 映射         |
| `Mappers/CommentMappers.cs`           | `ToDto`          | 评论 DTO 映射 (Func 委托) |
| `Mappers/CommentMappers.cs`           | `ToAdminDto`     | 管理员评论 DTO 映射       |
| `Mappers/CommentMappers.cs`           | `ToSummary`      | 评论摘要 DTO 映射         |
| `Mappers/PostMappers.cs`              | `ToSummaryDto`   | ✨ 新增：文章列表映射     |
| `Mappers/CategoryMappers.cs`          | `ToDto`          | ✨ 新增：分类 DTO 映射    |

### ✅ Controller 层解耦 (2026-01 完成)

| 原 Controller           | 分离后 Service               | 说明                    |
| :---------------------- | :--------------------------- | :---------------------- |
| `StatsController`       | `StatsService`               | 统计数据查询逻辑抽取    |
| `AboutController`       | `SiteContentService`         | 站点内容管理逻辑抽取    |
| `SiteContentController` | `SiteContentService`         | 与 AboutController 合并 |
| `CommentService`        | `CommentNotificationService` | 邮件通知逻辑独立 (SRP)  |

### ⚠️ 待重构

| 文件               | 行号 | 位置                          | 说明                                    |
| :----------------- | :--- | :---------------------------- | :-------------------------------------- |
| `PostService.cs`   | L123 | `GetAllPostsAsync` 内部       | 使用 `new PostSummaryDto(...)` 手动构造 |
| `PostService.cs`   | L453 | `GetDeletedPostsAsync`        | 使用 `new PostSummaryDto(...)` 手动构造 |
| `PostService.cs`   | L543 | `GetRelatedPostsAsync` (系列) | 使用 `new PostSummaryDto(...)` 手动构造 |
| `PostService.cs`   | L572 | `GetRelatedPostsAsync` (分类) | 使用 `new PostSummaryDto(...)` 手动构造 |
| `PostService.cs`   | L605 | `GetRelatedPostsAsync` (标签) | 使用 `new PostSummaryDto(...)` 手动构造 |
| `SeriesService.cs` | L67  | `GetSeriesPostsAsync`         | 使用 `new PostSummaryDto(...)` 手动构造 |

### 🧩 重构挑战

**为什么没有直接使用 `ToSummaryDto()`？**

1. **数据库投影优化**：上述位置使用 EF Core 的 `.Select()` 直接投影到匿名类型，避免加载完整实体
2. **性能考虑**：如果先加载完整的 `Post` 实体再调用 `ToSummaryDto()`，会导致 N+1 查询问题
3. **可见序号计算**：`GetAllPostsAsync` 需要额外计算系列可见序号，无法直接使用简单的扩展方法

### 💡 建议的解决方案

**方案 A：创建轻量级 Mapper 委托**

```csharp
// 适用于已投影的匿名类型
public static readonly Func<AnonymousPostData, PostSummaryDto> FromProjection = ...
```

**方案 B：创建专门的投影表达式**

```csharp
public static Expression<Func<Post, PostSummaryDto>> ToSummaryProjection =
    p => new PostSummaryDto(p.Id, p.Title, ...);
```

**方案 C：保持现状，添加注释说明**

- 在每个手动构造处添加 `// 🔧 性能优化：使用投影而非实体转换` 注释
- 确保字段顺序与 `PostSummaryDto` 构造函数一致

---

### ✅ Nullable 警告 (已修复)

| 文件                        | 行号 | 警告代码 | 状态      |
| :-------------------------- | :--- | :------- | :-------- |
| `Mappers/CommentMappers.cs` | L44  | CS8604   | ✅ 已修复 |

**修复方案**: 使用 null-forgiving operator (`ToDto!`)

---

## 🧐 架构审计发现 (2026-01-08)

| 等级     | 位置                           | 问题                                | 建议                                                            |
| :------- | :----------------------------- | :---------------------------------- | :-------------------------------------------------------------- |
| 🟢 Minor | `PostService.GetPostByIdAsync` | 返回实体而非 DTO                    | 拆分 `GetPostDtoByIdAsync` (公开) / `GetPostEntityAsync` (内部) |
| 🟢 Minor | `GlobalExceptionMiddleware`    | 未区分 `ArgumentException` 返回 400 | Controller 已显式捕获，Middleware 只兜底                        |

**权衡说明**: `GetPostByIdAsync` 返回实体是有意设计——Controller 需要多个字段组装复杂响应（系列信息）。重构需评估 Service 循环依赖风险。

---

## 📋 待办清单

- [x] Controller 层解耦，禁止直接注入 DbContext ✅ 2026-01-01
- [x] 为所有核心 Service 添加单元测试 ✅ 2026-01-08 (189 个用例)
- [x] 修复 `CommentMappers.cs` 的 nullable 警告 ✅ 2026-01-04
- [x] 修复订单邮件发送失败问题 (DbContext 释放) ✅ 2026-01-08
- [x] 补充 SeriesService / UserService 单元测试 ✅ 2026-01-08
- [ ] 决定 DTO 投影方案（A/B/C）
- [ ] 考虑将 `PostMappingExtensions.cs` 移动到 `Mappers/` 目录
- [ ] 引入 Bogus 库优化测试数据生成 (当模型字段 > 15 或用例 > 300 时)
- [ ] 添加集成测试 (WebApplicationFactory)
- [ ] **邮件系统迁移到 Azure Function** (详见 [EMAIL_SYSTEM.md](../architecture/EMAIL_SYSTEM.md))
- [ ] (P3) 拆分 `GetPostByIdAsync` 为 DTO/Entity 双版本
- [ ] (P4) `GlobalExceptionMiddleware` 增加 `ArgumentException` 区分

---

_最后更新：2026-01-08_
