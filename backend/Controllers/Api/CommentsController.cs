using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
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
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentDto dto)
    {
        // 1. 验证输入
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

        // 2. 身份识别
        // 尝试判断当前请求是否来自已登录用户
        User? user = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr != null && int.TryParse(userIdStr, out int userId))
            {
                user = await context.Users.FindAsync(userId);
                if (user != null)
                {
                    // 如果是登录用户，绑定 UserId 并自动填充 GuestName 为用户名
                    comment.UserId = user.Id;
                    comment.GuestName = user.Username; 
                }
            }
        }

        // 3. 处理匿名访客
        // 如果未登录，则使用前端传入的 GuestName，若未传则默认为"匿名访客"
        if (comment.UserId == null)
        {
             comment.GuestName = string.IsNullOrWhiteSpace(dto.GuestName) ? "匿名访客" : dto.GuestName;
        }

        // 4. 保存评论
        await postService.AddCommentAsync(comment);

        // 5. 返回创建成功的评论对象 (包含用户信息以便前端立即渲染)
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

    /// <summary>
    /// 获取文章的评论列表 (分页)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetComments(int postId, int page = 1, int pageSize = 5)
    {
        // 1. 获取评论数据和总数
        var comments = await postService.GetCommentsAsync(postId, page, pageSize);
        var totalCount = await postService.GetCommentCountAsync(postId);
        
        // 2. 判断是否还有更多页
        bool hasMore = (page * pageSize) < totalCount;

        // 3. 返回结果
        return Ok(new
        {
            success = true,
            totalCount, 
            comments = comments.Select(c => new 
            {
                c.Id,
                // 显示逻辑：如果有关联的注册用户，优先显示该用户当前的用户名 (而不是评论时的快照)
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