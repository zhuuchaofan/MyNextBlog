# Swagger 文档标注规范

> **最后更新**: 2026-01-11  
> **适用范围**: MyNextBlog 后端 (.NET 10 Web API)

---

## 1. 为什么需要 `[ProducesResponseType]`？

ASP.NET Core 的 Swagger 生成器能自动推断请求类型，但对于**匿名类型响应**无法生成准确的 Schema。

### 问题示例

```csharp
// ❌ Swagger 无法推断响应结构
[HttpGet]
public IActionResult GetPosts()
{
    return Ok(new { success = true, data = posts });
}
```

### 解决方案

```csharp
// ✅ 添加 ProducesResponseType 标注
[HttpGet]
[ProducesResponseType(StatusCodes.Status200OK)]
public IActionResult GetPosts() { ... }
```

---

## 2. 标注规则

### 2.1 必须标注的状态码

| 状态码                | 场景         | 示例              |
| :-------------------- | :----------- | :---------------- |
| `200 OK`              | 所有成功响应 | 必须标注          |
| `201 Created`         | 创建资源成功 | `POST` 创建新实体 |
| `400 BadRequest`      | 参数验证失败 | 必填字段缺失      |
| `401 Unauthorized`    | 未认证       | 需要登录的接口    |
| `403 Forbidden`       | 无权限       | 管理员专用接口    |
| `404 NotFound`        | 资源不存在   | 按 ID 查询        |
| `409 Conflict`        | 资源冲突     | 重复创建          |
| `429 TooManyRequests` | 频率限制     | 登录、评论        |

### 2.2 标注模板

#### 公开读取接口

```csharp
/// <summary>
/// 获取列表
/// </summary>
[HttpGet]
[ProducesResponseType(StatusCodes.Status200OK)]
public async Task<IActionResult> GetAll() { ... }
```

#### 按 ID 查询

```csharp
/// <summary>
/// 获取详情
/// </summary>
[HttpGet("{id}")]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<IActionResult> GetById(int id) { ... }
```

#### 需要认证的写入接口

```csharp
/// <summary>
/// 创建资源
/// </summary>
[HttpPost]
[Authorize]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public async Task<IActionResult> Create([FromBody] CreateDto dto) { ... }
```

#### 管理员专用接口

```csharp
/// <summary>
/// 删除资源（管理员）
/// </summary>
[HttpDelete("{id}")]
[Authorize(Roles = "Admin")]
[ProducesResponseType(StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<IActionResult> Delete(int id) { ... }
```

---

## 3. 高级用法：指定响应类型

当需要让 Swagger 显示具体的响应 Schema 时，使用 `typeof()` 指定类型：

```csharp
[HttpGet]
[ProducesResponseType(typeof(UserPresenceResponse), StatusCodes.Status200OK)]
public IActionResult GetStatus() { ... }
```

### 通用响应类型

项目提供了以下通用响应类型（定义于 `DTOs/ApiResponses.cs`）：

| 类型                  | 用途         |
| :-------------------- | :----------- |
| `ApiResponse<T>`      | 单个实体响应 |
| `PagedApiResponse<T>` | 分页列表响应 |
| `ApiErrorResponse`    | 错误响应     |
| `SuccessResponse`     | 简单成功响应 |

---

## 4. 代码审查清单

新增或修改 Controller 时，请检查：

- [ ] 每个 Action 方法都有 `[ProducesResponseType]` 标注
- [ ] 标注的状态码与代码实际返回的一致
- [ ] 需要认证的接口标注了 `401` 和 `403`（如适用）
- [ ] 按 ID 查询的接口标注了 `404`

---

## 5. 验证方法

1. 启动后端: `dotnet run`
2. 访问 Swagger UI: http://localhost:5095/swagger
3. 检查每个端点的 "Responses" 部分是否显示正确的状态码
