using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Ganss.Xss;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 评论管理控制器
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class CommentsController(ICommentService commentService, AppDbContext context, IMemoryCache cache, IHtmlSanitizer sanitizer) : ControllerBase
{
    /// <summary>
    /// 发表新评论
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentDto dto)
    {
        // 0. 频率限制 (Rate Limiting)
        // 获取客户端 IP (兼容反向代理)
        string ipAddress = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault() 
                           ?? HttpContext.Connection.RemoteIpAddress?.ToString() 
                           ?? "unknown";
                           
        string cacheKey = $"comment_rate_limit_{ipAddress}";
        if (cache.TryGetValue(cacheKey, out _))
        {
            return StatusCode(429, new { success = false, message = "评论太频繁，请稍后再试 (60s)" });
        }
        
        // 设置限制：60秒内只能发一条
        cache.Set(cacheKey, true, TimeSpan.FromSeconds(60));

        // 1. 验证输入
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { success = false, message = "评论内容不能为空" });
        }

        // 2. XSS 清洗
        // 防止用户提交恶意脚本 (如 <script>alert(1)</script>)
        // 使用注入的 sanitizer 实例
        var safeContent = sanitizer.Sanitize(dto.Content);

        // 如果清洗后内容变为空（说明全是恶意标签），则拒绝
        if (string.IsNullOrWhiteSpace(safeContent))
        {
             return BadRequest(new { success = false, message = "评论内容包含非法字符" });
        }

        var comment = new Comment
        {
            PostId = dto.PostId,
            Content = safeContent, // 使用清洗后的内容
            CreateTime = DateTime.Now,
            ParentId = dto.ParentId // 赋值 ParentId
        };

        // 3. 身份识别
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

        // 4. 处理匿名访客
        // 如果未登录，则使用前端传入的 GuestName，若未传则默认为"匿名访客"
        if (comment.UserId == null)
        {
             comment.GuestName = string.IsNullOrWhiteSpace(dto.GuestName) ? "匿名访客" : dto.GuestName;
        }

        // 5. 保存评论
        await commentService.AddCommentAsync(comment);

        // 6. 返回创建成功的评论对象 (包含用户信息以便前端立即渲染)
        return Ok(new
        {
            success = true,
            comment = MapToDto(comment)
        });
    }

    /// <summary>
    /// 获取文章的评论列表 (分页)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetComments(int postId, int page = 1, int pageSize = 5)
    {
        // 1. 获取评论数据和总数
        var comments = await commentService.GetCommentsAsync(postId, page, pageSize);
        var totalCount = await commentService.GetCommentCountAsync(postId);
        
        // 2. 判断是否还有更多页
        bool hasMore = (page * pageSize) < totalCount;

        // 3. 返回结果
        return Ok(new
        {
            success = true,
            totalCount, 
            comments = comments.Select(MapToDto),
            hasMore
        });
    }

    private static CommentDto MapToDto(Comment c)
    {
        return new CommentDto(
            c.Id,
            c.User != null ? c.User.Username : (c.GuestName ?? "匿名"),
            c.Content,
            c.CreateTime.ToString("yyyy/MM/dd HH:mm"),
            c.User?.AvatarUrl,
            c.ParentId,
            c.Children.Select(MapToDto).ToList()
        );
    }

    public record CreateCommentDto(int PostId, string Content, string? GuestName, int? ParentId);
    public record CommentDto(int Id, string GuestName, string Content, string CreateTime, string? UserAvatar, int? ParentId, List<CommentDto> Children);
}