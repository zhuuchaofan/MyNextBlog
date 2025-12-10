using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
public class CommentsController(IPostService postService, AppDbContext context) : ControllerBase
{
    // 提交新评论
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

        // 检查用户是否登录
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
                    comment.GuestName = user.Username; // 存个快照
                }
            }
        }

        // 如果没有关联到用户 (未登录)，则使用 GuestName
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
                UserAvatar = user?.AvatarUrl // 如果是登录用户，返回头像
            }
        });
    }

    // 获取分页评论
    [HttpGet]
    public async Task<IActionResult> GetComments(int postId, int page = 1, int pageSize = 5)
    {
        var comments = await postService.GetCommentsAsync(postId, page, pageSize);
        var totalCount = await postService.GetCommentCountAsync(postId);
        
        // 是否还有更多？
        bool hasMore = (page * pageSize) < totalCount;

        return Ok(new
        {
            success = true,
            totalCount, // 返回评论总数
            comments = comments.Select(c => new 
            {
                c.Id,
                // 如果有关联用户，优先显示用户的当前信息 (名字和头像)
                GuestName = c.User != null ? c.User.Username : c.GuestName, 
                c.Content,
                CreateTime = c.CreateTime.ToString("yyyy/MM/dd HH:mm"),
                UserAvatar = c.User?.AvatarUrl 
            }),
            hasMore
        });
    }

    // 定义 DTO，确保 API 入参干净纯粹
    public record CreateCommentDto(int PostId, string Content, string? GuestName);
}