// ============================================================================
// Controllers/Api/CommentsController.cs - 评论 API 控制器
// ============================================================================
// 此控制器处理博客评论相关的 HTTP 请求。
//
// **公开接口**: 发表评论、获取评论列表
// **管理接口**: 审核、批量操作、删除
//
// **安全特性**:
//   - 频率限制 (60 秒内只能发一条)
//   - XSS 过滤 (Service 层处理)
//   - 敏感词检测

// `using` 语句用于导入必要的命名空间
using System.Security.Claims;          // 用户声明
using Microsoft.AspNetCore.Mvc;         // ASP.NET Core MVC
using Microsoft.AspNetCore.Authorization; // 授权特性
using MyNextBlog.DTOs;                  // 数据传输对象
using MyNextBlog.Models;                // 领域模型
using MyNextBlog.Services;              // 业务服务
using MyNextBlog.Extensions;            // 扩展方法
using MyNextBlog.Mappers;               // DTO 映射器 (Func 委托模式)

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `CommentsController` 是评论模块的 API 控制器。
/// 
/// **路由**: `/api/comments`
/// **公开接口**: POST (发表), GET (列表)
/// **管理接口**: GET admin, PATCH approval, DELETE, batch-*
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class CommentsController(ICommentService commentService) : ControllerBase
{
    /// <summary>
    /// 发表新评论
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateComment([FromBody] CreateCommentDto dto)
    {
        // 0. 频率限制 (Rate Limiting) - 逻辑已移至 Service 层
        string ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                           ?? HttpContext.Connection.RemoteIpAddress?.ToString() 
                           ?? "unknown";
                           
        if (commentService.IsRateLimited(ipAddress))
        {
            return StatusCode(429, new { success = false, message = "评论太频繁，请稍后再试 (60s)" });
        }

        // 1. 获取当前用户ID (如果已登录)
        // 使用扩展方法获取用户ID
        int? userId = User.GetUserId();

        // 2. 调用服务层创建评论
        var result = await commentService.CreateCommentAsync(dto.PostId, dto.Content, dto.GuestName, dto.ParentId, userId);

        if (!result.Success)
        {
            return BadRequest(new { success = false, message = result.Message });
        }

        // 3. 返回结果
        // 使用 CommentMappers.ToDto 委托进行映射
        return Ok(new
        {
            success = true,
            comment = CommentMappers.ToDto(result.Comment!),
            message = result.Message
        });
    }

    /// <summary>
    /// 获取文章的评论列表 (分页)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetComments(int postId, int page = 1, int pageSize = 5)
    {
        var comments = await commentService.GetCommentsAsync(postId, page, pageSize);
        var totalCount = await commentService.GetCommentCountAsync(postId);
        bool hasMore = (page * pageSize) < totalCount;

        return Ok(new
        {
            success = true,
            totalCount, 
            // 使用 CommentMappers.ToDto 委托：支持在 LINQ Select 中直接使用
            comments = comments.Select(CommentMappers.ToDto),
            hasMore
        });
    }

    /// <summary>
    /// [Admin] 获取所有评论列表
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<IActionResult> GetAdminComments(int page = 1, int pageSize = 20, bool? isApproved = null)
    {
        var (comments, totalCount) = await commentService.GetAllCommentsForAdminAsync(page, pageSize, isApproved);
        
        return Ok(new
        {
            success = true,
            totalCount,
            // 使用 CommentMappers.ToAdminDto 委托：统一管理员视图映射
            // 替代之前的匿名类型，确保类型安全和可维护性
            comments = comments.Select(CommentMappers.ToAdminDto)
        });
    }

    /// <summary>
    /// [Admin] 切换审核状态
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/approval")]
    public async Task<IActionResult> ToggleApproval(int id)
    {
        var result = await commentService.ToggleApprovalAsync(id);
        if (!result) return NotFound(new { success = false, message = "评论不存在" });
        return Ok(new { success = true });
    }

    /// <summary>
    /// [Admin] 删除评论
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var result = await commentService.DeleteCommentAsync(id);
        if (!result) return NotFound(new { success = false, message = "评论不存在" });
        return Ok(new { success = true });
    }

    /// <summary>
    /// [Admin] 批量批准
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("batch-approve")]
    public async Task<IActionResult> BatchApprove([FromBody] List<int> ids)
    {
        var count = await commentService.BatchApproveAsync(ids);
        return Ok(new { success = true, count });
    }

    /// <summary>
    /// [Admin] 批量删除
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("batch-delete")]
    public async Task<IActionResult> BatchDelete([FromBody] List<int> ids)
    {
        var count = await commentService.BatchDeleteAsync(ids);
        return Ok(new { success = true, count });
    }

    // ✅ 已删除私有 MapToDto 方法
    // 映射逻辑已迁移到 CommentMappers 静态类中，使用 Func 委托模式统一管理
    // 优势：
    //   1. 可在 Controller 和 Service 层复用
    //   2. 类型安全且性能优异（编译器内联优化）
    //   3. 支持 LINQ 链式调用（如 .Select(CommentMappers.ToDto)）
}
