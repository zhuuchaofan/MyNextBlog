using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;
using MyNextBlog.Extensions;
using MyNextBlog.Mappers;  // 引入映射器（使用 Func 委托模式）

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 评论管理控制器
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
