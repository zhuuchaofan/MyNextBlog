// `using` 语句用于导入必要的命名空间，以便在当前文件中使用其中定义的类型（类、接口等）。
using Microsoft.AspNetCore.Authentication.JwtBearer; // 引入 JWT Bearer 认证方案相关类型
using Microsoft.AspNetCore.Authorization;            // 引入授权相关特性，如 [Authorize]
using Microsoft.AspNetCore.Mvc;                      // 引入 ASP.NET Core MVC 核心类型，如 ControllerBase, IActionResult, [HttpGet] 等
using MyNextBlog.Models;                             // 引入应用程序的领域模型，如 Post
using MyNextBlog.Services;                           // 引入业务服务层接口，如 IPostService, ITagService
using MyNextBlog.DTOs;                              // 引入数据传输对象，用于 API 请求和响应
using MyNextBlog.Extensions;                         // 引入自定义扩展方法
using System.Security.Claims;                       // 引入安全声明，用于获取用户身份信息

// `namespace` 声明了当前文件中的代码所属的命名空间。
// 命名空间有助于组织代码，避免命名冲突。
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `PostsApiController` 是一个 ASP.NET Core Web API 控制器，负责处理与博客文章相关的 HTTP 请求。
/// 它提供了一系列 RESTful 接口，用于文章的查询、发布、更新和删除。
/// </summary>
// `[Route("api/posts")]` 特性 (Attribute)：
// 作用：定义此控制器所有 Action 方法的根路由模板。
// 例如，如果一个 Action 方法使用 `[HttpGet]`，那么它的完整路由可能是 `GET /api/posts`。
// 如果一个 Action 方法使用 `[HttpGet("{id}")]`，那么它的完整路由可能是 `GET /api/posts/{id}`。
[Route("api/posts")]
// `[ApiController]` 特性：
// 作用：这是一个非常方便的特性，它为 Web API 控制器提供了许多“开箱即用”的行为，例如：
// 1. 自动 HTTP 400 响应：当模型绑定或验证失败时，自动返回 BadRequest 响应。
// 2. 绑定源推断：自动推断 action 参数的数据来源（是来自路由、查询字符串还是请求体）。
// 3. 规范化错误响应：提供了 `ValidationProblemDetails` 响应。
// 4. 不要求从请求体中返回复杂类型等。
[ApiController]
// `public class PostsApiController(...) : ControllerBase`
// 这是控制器的定义。
// `IPostService postService, ITagService tagService`: 这是 C# 9 引入的“主构造函数”语法。
// 作用：它声明了 `PostsApiController` 依赖于 `IPostService` 和 `ITagService` 这两个服务。
// ASP.NET Core 的依赖注入（DI）容器会自动识别这些依赖，并在创建 `PostsApiController` 实例时，
// 提供这些服务的具体实现实例。这种方式叫做“构造函数注入”，是实现控制反转（IoC）和解耦的核心方式。
// `ControllerBase`: `PostsApiController` 继承自 `ControllerBase`。
// 作用：`ControllerBase` 是 ASP.NET Core MVC 中用于构建 Web API 的基类，它提供了：
// 1. 对 HTTP 请求和响应的访问能力（例如 `Request`, `Response`）。
// 2. 方便的方法来生成各种 HTTP 状态码的响应（例如 `Ok()`, `NotFound()`, `BadRequest()`, `Unauthorized()`）。
// 3. 对模型绑定、验证和授权等功能的内置支持。
public class PostsApiController(IPostService postService, ICommentService commentService) : ControllerBase
{
    /// <summary>
    /// `GetPosts` 方法是一个**公开接口**，用于获取博客文章的列表。
    /// 它支持分页、搜索、按标签和按分类筛选。
    /// </summary>
    // `[HttpGet]`: HTTP Get 请求的路由特性。表示这个方法会响应 HTTP GET 请求。
    // 因为控制器类上已经有 `[Route("api/posts")]`，所以这个方法的完整路由是 `GET /api/posts`。
    [HttpGet]
    // `public async Task<IActionResult> GetPosts(...)`: 这是方法的签名。
    // `async Task<IActionResult>`: 表示这是一个异步方法，并且会返回一个实现了 `IActionResult` 接口的对象。
    //   - `async`/`await`: 异步编程的关键。`await` 关键字用于等待一个异步操作（例如数据库查询）完成，
    //     同时不会阻塞当前线程，从而提高服务器的并发处理能力。
    //   - `IActionResult`: 是一个接口，表示 Action 方法返回的结果类型。
    //     `ControllerBase` 提供了一系列返回 `IActionResult` 的帮助方法，例如 `Ok()`, `NotFound()` 等，
    //     它们会自动处理 HTTP 状态码和响应体。
    public async Task<IActionResult> GetPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? search = null,
        [FromQuery] string? tag = null,
        [FromQuery] int? categoryId = null)
    {
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        
        // 调用支持数据库级分页的新接口，直接获取 (数据, 总条数)
        var (allPosts, totalCount) = await postService.GetAllPostsAsync(
            page, pageSize, 
            includeHidden: isAdmin, 
            categoryId: categoryId, 
            searchTerm: search, 
            tagName: tag
        );

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var posts = allPosts.Select(p => p.ToSummaryDto()).ToList();

        return Ok(new
        {
            success = true,
            data = posts,
            meta = new { page, pageSize, totalCount, totalPages, hasMore = page < totalPages }
        });
    }

    /// <summary>
    /// `GetAdminPosts` 方法是一个**管理员接口**，用于获取所有文章列表，
    /// **强制包含隐藏（草稿）文章**。此接口需要管理员权限才能访问。
    /// </summary>
    // `[HttpGet("admin")]`: HTTP Get 请求的路由特性。`"admin"` 会附加到控制器根路由 `api/posts` 后面。
    // 因此，这个方法的完整路由是 `GET /api/posts/admin`。
    [HttpGet("admin")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetAdminPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        // 直接调用支持分页的接口
        var (allPosts, totalCount) = await postService.GetAllPostsAsync(
            page, pageSize, 
            includeHidden: true
        );

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var posts = allPosts.Select(p => p.ToSummaryDto()).ToList();

        return Ok(new
        {
            success = true,
            data = posts,
            meta = new { page, pageSize, totalCount, totalPages, hasMore = page < totalPages }
        });
    }

    /// <summary>
    /// `GetAdminPost` 方法是一个**管理员接口**，用于根据文章 ID 获取单篇文章的完整详情。
    /// 此接口强制包含隐藏文章（草稿），并且需要管理员权限才能访问。
    /// </summary>
    // `[HttpGet("admin/{id}")]`: HTTP Get 请求路由。`{id}` 是一个路由参数，用于从 URL 中捕获文章 ID。
    // 例如：`GET /api/posts/admin/123` 中的 `123` 将被绑定到 `id` 参数。
    [HttpGet("admin/{id}")]
    // `[Authorize(...)]`: 同样需要通过 JWT Bearer 认证，并且用户角色必须是 "Admin"。
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetAdminPost(int id)
    {
        // 1. **获取文章详情 (允许隐藏文章)**
        // 调用 `postService.GetPostByIdAsync` 方法，传入从路由中获取的 `id`。
        // `includeHidden: true` 确保即使文章是隐藏状态，管理员也能获取到它的详情。
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        if (post == null)
        {
            // 如果文章不存在（无论是公开还是隐藏），则返回 `404 Not Found` 响应。
            return NotFound(new { success = false, message = "文章不存在" });
        }
        
        // 2. **补充评论总数信息 (用于前端显示)**
        // 调用 `commentService.GetCommentCountAsync` 方法，获取该文章的评论总数。
        // 这个信息通常在文章详情页会显示，为了避免前端再次发起请求，这里一并提供。
        var commentCount = await commentService.GetCommentCountAsync(id);
        
        // 3. **返回完整详情 DTO**
        // `post.ToDetailDto(commentCount)`: 将查询到的 `Post` 实体转换为 `PostDetailDto`。
        // `PostDetailDto` 包含了文章的完整内容和所有相关信息，以及刚刚获取到的评论总数。
        // 返回一个包含成功状态和文章详情数据的 `200 OK` 响应。
        return Ok(new { success = true, data = post.ToDetailDto(commentCount) });
    }

    /// <summary>
    /// `GetPost` 方法是一个**公开接口**，用于根据文章 ID 获取单篇文章的详情。
    /// 此接口会自动根据当前用户的权限，过滤掉隐藏（草稿）文章。
    /// </summary>
    // `[HttpGet("{id}")]`: HTTP Get 请求路由。`{id}` 是路由参数，表示文章 ID。
    // 完整路由为 `GET /api/posts/{id}`。
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPost(int id)
    {
        // 1. **确定权限上下文**
        // 同样检查当前用户是否已登录并且是 "Admin" 角色。
        // 这决定了后续调用 `GetPostByIdAsync` 时 `includeHidden` 参数的值：
        //   - 如果是 Admin，则可以获取隐藏文章。
        //   - 如果不是 Admin（包括未登录用户），则只能获取公开文章。
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        
        // 2. **获取文章详情 (根据权限过滤隐藏文章)**
        // 调用 `postService.GetPostByIdAsync`，`includeHidden` 参数动态地根据 `isAdmin` 决定。
        var post = await postService.GetPostByIdAsync(id, includeHidden: isAdmin);
        
        if (post == null)
        {
            // 如果文章不存在，或者对于非管理员用户来说文章是隐藏的，则返回 `404 Not Found`。
            return NotFound(new { success = false, message = "文章不存在或已隐藏" });
        }

        // 3. **补充评论总数**
        // 获取文章的评论总数，用于详情页显示。
        var commentCount = await commentService.GetCommentCountAsync(id);

        // 返回包含成功状态和文章详情数据的 `200 OK` 响应。
        return Ok(new { success = true, data = post.ToDetailDto(commentCount) });
    }

    /// <summary>
    /// `CreatePost` 方法是一个**管理员接口**，用于发布一篇新的博客文章。
    /// 此接口需要管理员权限。
    /// </summary>
    // `[HttpPost]`: HTTP Post 请求的路由特性。表示这个方法会响应 HTTP POST 请求。
    // 完整路由为 `POST /api/posts`。
    [HttpPost]
    // `[Authorize(...)]`: 同样需要通过 JWT Bearer 认证，并且用户角色必须是 "Admin"。
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    // `[FromBody] CreatePostDto dto`:
    //   - `[FromBody]`: 特性，指示 `dto` 参数的值应该从 HTTP 请求的 Body（请求体）中绑定。
    //     ASP.NET Core 会自动将 JSON 格式的请求体反序列化为 `CreatePostDto` 对象。
    //   - `CreatePostDto`: 这是一个数据传输对象 (DTO)，专门用于接收创建文章所需的数据。
    //     使用 DTO 而不是直接使用 `Post` 实体作为参数，可以：
    //       1. **防止过度暴露**: 避免客户端设置数据库中不应该由它们控制的字段（例如 `Id`, `CreateTime` 等）。
    //       2. **模型验证**: 可以在 DTO 上使用 `[Required]` 等数据注解进行验证，清晰地定义了接口的输入格式。
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId)) userId = 0; 

        var post = await postService.AddPostAsync(dto, userId > 0 ? userId : null);
        
        return Ok(new { success = true, message = "发布成功", postId = post.Id, data = post.ToDetailDto() });
    }

    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto dto)
    {
        try 
        {
            var post = await postService.UpdatePostAsync(id, dto);
            return Ok(new { success = true, message = "更新成功", data = post.ToDetailDto() });
        }
        catch (ArgumentException ex)
        {
             return NotFound(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// `DeletePost` 方法是一个**管理员接口**，用于根据文章 ID 删除文章。
    /// 此接口需要管理员权限。
    /// </summary>
    // `[HttpDelete("{id}")]`: HTTP Delete 请求的路由特性。表示这个方法会响应 HTTP DELETE 请求。
    // `{id}` 是路由参数，表示要删除的文章 ID。
    // 完整路由为 `DELETE /api/posts/{id}`。
    [HttpDelete("{id}")]
    // `[Authorize(...)]`: 同样需要通过 JWT Bearer 认证，并且用户角色必须是 "Admin"。
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> DeletePost(int id)
    {
        // 1. **验证文章是否存在**
        // 在执行删除操作之前，首先检查要删除的文章是否存在。
        // `includeHidden: true` 确保管理员可以删除隐藏文章。
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        // 如果文章不存在，返回 `404 Not Found`。
        if (post == null) return NotFound(new { success = false, message = "文章不存在" });

        // 2. **执行删除操作**
        // 调用 `postService.DeletePostAsync` 方法来执行文章的删除。
        // `PostService` 内部会处理删除文章的所有相关逻辑，包括：
        //   - 从数据库中删除 `Post` 实体。
        //   - 处理关联数据的级联删除（例如，文章被删除时，其关联的评论和标签关系也会被删除）。
        //   - 清理云存储中与该文章关联的图片文件。
        await postService.DeletePostAsync(id);
        // 返回 `200 OK` 响应，表示文章删除成功。
        return Ok(new { success = true, message = "删除成功" });
    }


    /// <summary>
    /// `ToggleVisibility` 方法是一个**管理员接口**，用于快速切换文章的可见状态。
    /// （即将公开文章设为隐藏，将隐藏文章设为公开）
    /// 此接口需要管理员权限。
    /// </summary>
    // `[HttpPatch("{id}/visibility")]`: HTTP Patch 请求的路由特性。
    // `PATCH` 通常用于局部更新资源。这里用于更新文章的 `IsHidden` 字段。
    // 完整路由为 `PATCH /api/posts/{id}/visibility`。
    [HttpPatch("{id}/visibility")]
    // `[Authorize(...)]`: 同样需要通过 JWT Bearer 认证，并且用户角色必须是 "Admin"。
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> ToggleVisibility(int id)
    {
        // 1. **执行可见性切换操作**
        // 调用 `postService.TogglePostVisibilityAsync` 方法来切换文章的 `IsHidden` 状态。
        // 这个方法会返回一个布尔值，表示操作是否成功（例如，如果文章 ID 不存在，则会失败）。
        var success = await postService.TogglePostVisibilityAsync(id);
        // 如果 `success` 为 `false`（通常意味着文章 ID 不存在），返回 `404 Not Found`。
        if (!success) return NotFound(new { success = false, message = "文章不存在" });

        // 2. **获取更新后的状态并返回给前端**
        // 为了让前端能够立即显示更新后的文章状态，我们再次从数据库中获取文章，
        // 并将其当前的 `IsHidden` 状态返回。
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        // 返回 `200 OK` 响应，包含成功信息和更新后的 `isHidden` 状态。
        return Ok(new { success = true, message = "状态更新成功", isHidden = post?.IsHidden });
    }

    /// <summary>
    /// 切换点赞状态 (公开接口，支持游客)
    /// </summary>
    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(int id)
    {
        int? userId = null;
        // 尝试获取登录用户 ID
        if (User.Identity?.IsAuthenticated == true)
        {
             var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
             if (int.TryParse(userIdStr, out int uid)) userId = uid;
        }

        // 获取 IP 地址 (由 ForwardedHeadersMiddleware 统一处理)
        string? ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        // 如果既没有登录也没有 IP (极端情况)，记录为 "unknown"
        if (!userId.HasValue && string.IsNullOrEmpty(ipAddress))
        {
            ipAddress = "unknown";
        }

        try 
        {
            var (isLiked, newLikeCount) = await postService.ToggleLikeAsync(id, userId, ipAddress);
            return Ok(new { success = true, isLiked, likeCount = newLikeCount });
        }
        catch (ArgumentException)
        {
            return NotFound(new { success = false, message = "文章不存在" });
        }
    }
}
