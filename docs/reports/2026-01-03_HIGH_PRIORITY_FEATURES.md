# 高优先级安全功能实现记录

> 实施日期: 2026-01-03

## 1. API 响应时间监控

### 新增文件

- [RequestTimingMiddleware.cs](file:///Volumes/fanxiang/MyTechBlog/backend/Middlewares/RequestTimingMiddleware.cs)

### 功能

- 记录所有 API 请求耗时
- 超过 **500ms** 的请求输出 Warning 日志
- 排除 `/health`、`/swagger` 等端点

### 使用

自动生效，无需额外配置。慢请求日志示例：

```
⚠️ 慢请求: GET /api/posts - 523ms (Status: 200)
```

---

## 2. 单元测试框架

### 新增文件

- `backend.Tests/` 测试项目 (11 个测试类)

### 技术栈

| 组件             | 版本/说明  |
| :--------------- | :--------- |
| xUnit            | 测试框架   |
| Moq              | Mock 依赖  |
| FluentAssertions | 可读断言   |
| EF Core InMemory | 内存数据库 |

### 测试统计 (129 个用例) ✅ 2026-01-04

| 测试类                    | 数量 | 覆盖功能                   |
| :------------------------ | :--: | :------------------------- |
| PostServiceTests          |  14  | CRUD、分页、可见性         |
| AuthServiceTests          |  12  | 登录、注册、Token、密码    |
| CommentServiceTests       |  16  | CRUD、批量、频率限制       |
| CategoryServiceTests      |  9   | 获取、创建、去重           |
| TagServiceTests           |  10  | 热门标签、创建去重         |
| EmailTemplateServiceTests |  10  | 获取、更新、渲染、XSS      |
| StatsServiceTests         |  10  | 公开统计、仪表盘           |
| PlanServiceTests          |  17  | CRUD、日程、活动、公开 API |
| SiteContentServiceTests   |  11  | 获取、Upsert、批量操作     |
| ImageServiceTests         |  10  | 记录、关联、清理僵尸图片   |
| AnniversaryServiceTests   |  11  | CRUD、公开获取、日期校验   |

### 运行命令

```bash
cd backend.Tests && dotnet test
```

---

## 3. 登录频率限制

### 修改文件

- [Program.cs](file:///Volumes/fanxiang/MyTechBlog/backend/Program.cs) - 添加 Rate Limiter 服务
- [MiddlewarePipelineExtensions.cs](file:///Volumes/fanxiang/MyTechBlog/backend/Extensions/MiddlewarePipelineExtensions.cs) - 注册中间件
- [AuthController.cs](file:///Volumes/fanxiang/MyTechBlog/backend/Controllers/Api/AuthController.cs) - 添加 `[EnableRateLimiting]`

### 限流策略

| 策略    | 限制        | 作用域            |
| :------ | :---------- | :---------------- |
| `login` | 5 次/分钟   | `/api/auth/login` |
| 全局    | 100 次/分钟 | 所有 API (按 IP)  |

### 触发响应

超出限制返回 `429 Too Many Requests`

---

## 4. 遇到的问题 & 解决方案

### 问题 1: 项目引用缺失

```
error CS0246: The type or namespace name 'MyNextBlog' could not be found
```

**解决**: 手动在 csproj 添加 `<ProjectReference Include="..\backend\MyNextBlog.csproj" />`

### 问题 2: 构造函数参数顺序错误

```
error CS1503: cannot convert from 'ITagService' to 'IMemoryCache'
```

**解决**: 查看 PostService 源码确认正确顺序：`(context, imageService, cache, tagService, logger)`

### 问题 3: 模型属性名不匹配

```
error CS0117: 'Post' does not contain a definition for 'AuthorId'
```

**解决**: 使用正确属性名 `UserId`

### 问题 4: Rate Limiter API 不存在

```
error CS1061: 'RateLimiterOptions' does not contain a definition for 'AddFixedWindowLimiter'
```

**解决**: 使用 `AddPolicy` + `RateLimitPartition.GetFixedWindowLimiter` 替代

---

## 5. 后续建议

- [x] 为 AuthService、CommentService 补充单元测试 ✅ 已完成
- [x] 添加 CategoryService、TagService 单元测试 ✅ 已完成
- [x] 添加 PlanService 单元测试 ✅ 已完成
- [x] 添加 ImageService、AnniversaryService 单元测试 ✅ 2026-01-04
- [ ] 引入 **Bogus** 库优化测试数据生成 (当模型复杂度增加时)
- [ ] 添加集成测试 (WebApplicationFactory)
- [ ] 考虑使用 Redis 实现分布式 Rate Limiting
