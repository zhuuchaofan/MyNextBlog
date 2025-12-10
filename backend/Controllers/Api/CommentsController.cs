using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 评论管理控制器
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class CommentsController(IPostService postService, AppDbContext context) : ControllerBase
{
    /// <summary>
    /// 发表新评论
    /// </summary>
    /// <remarks>
    /// 支持两种模式：
    /// 1. 登录用户：自动绑定 UserId，显示用户头像和昵称。
    /// 2. 匿名访客：使用前端传入的 GuestName。
    /// </remarks>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { success = false, message = "评论内容不能为空" });
        }

        var comment = new Comment
        {
            PostId = dto.PostId,
            Content = dto.Content,
            CreateTime = DateTime.Now
        };

        // 尝试获取当前登录用户
        User? user = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr != null && int.TryParse(userIdStr, out int userId))
            {
                user = await context.Users.FindAsync(userId);
                if (user != null)
                {
                    comment.UserId = user.Id;
                    comment.GuestName = user.Username; // 存个快照，以防用户后来注销了账号评论还在
                }
            }
        }

        // 如果是匿名用户，使用传入的昵称 (默认为"匿名访客")
        if (comment.UserId == null)
        {
             comment.GuestName = string.IsNullOrWhiteSpace(dto.GuestName) ? "匿名访客" : dto.GuestName;
        }

        await postService.AddCommentAsync(comment);

        return Ok(new
        {
            success = true,
            comment = new
            {
                comment.Id,
                comment.GuestName,
                comment.Content,
                CreateTime = comment.CreateTime.ToString("yyyy/MM/dd HH:mm"),
                UserAvatar = user?.AvatarUrl // 如果是登录用户，返回头像供前端即时展示
            }
        });
    }

    /// <summary>
    /// 获取文章的评论列表 (分页)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetComments(int postId, int page = 1, int pageSize = 5)
    {
        var comments = await postService.GetCommentsAsync(postId, page, pageSize);
        var totalCount = await postService.GetCommentCountAsync(postId);
        
        bool hasMore = (page * pageSize) < totalCount;

        return Ok(new
        {
            success = true,
            totalCount, 
            comments = comments.Select(c => new 
            {
                c.Id,
                // 显示逻辑：如果关联了注册用户，优先显示该用户最新的昵称和头像
                GuestName = c.User != null ? c.User.Username : c.GuestName, 
                c.Content,
                CreateTime = c.CreateTime.ToString("yyyy/MM/dd HH:mm"),
                UserAvatar = c.User?.AvatarUrl 
            }),
            hasMore
        });
    }

    public record CreateCommentDto(int PostId, string Content, string? GuestName);
}
