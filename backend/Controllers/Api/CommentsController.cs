using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

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
    public async Task<IActionResult> Create([FromBody] CreateCommentDto dto)
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
        int? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdStr, out int uid))
            {
                userId = uid;
            }
        }

        // 2. 调用服务层创建评论
        var result = await commentService.CreateCommentAsync(dto.PostId, dto.Content, dto.GuestName, dto.ParentId, userId);

        if (!result.Success)
        {
            return BadRequest(new { success = false, message = result.Message });
        }

        // 3. 返回结果
        return Ok(new
        {
            success = true,
            comment = MapToDto(result.Comment!),
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
            comments = comments.Select(MapToDto),
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
            comments = comments.Select(c => new
            {
                c.Id,
                c.Content,
                c.CreateTime,
                c.GuestName,
                c.GuestEmail,
                c.IsApproved,
                PostTitle = c.Post?.Title,
                PostId = c.PostId,
                UserAvatar = c.User?.AvatarUrl
            })
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

    private static CommentDto MapToDto(Comment c)
    {
        string authorName = "匿名";
        if (c.User != null)
        {
            authorName = !string.IsNullOrEmpty(c.User.Nickname) ? c.User.Nickname : c.User.Username;
        }
        else if (!string.IsNullOrEmpty(c.GuestName))
        {
            authorName = c.GuestName;
        }

        return new CommentDto(
            c.Id,
            authorName,
            c.Content,
            c.CreateTime.ToString("yyyy/MM/dd HH:mm"),
            c.User?.AvatarUrl,
            c.ParentId,
            c.Children.Select(MapToDto).ToList()
        );
    }
}
