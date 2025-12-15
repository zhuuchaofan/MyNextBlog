using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Ganss.Xss;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services.Email;
using MyNextBlog.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore; // Added this line // Added this line

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 评论管理控制器
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class CommentsController(ICommentService commentService, AppDbContext context, IMemoryCache cache, IHtmlSanitizer sanitizer, IConfiguration configuration, IEmailService emailService) : ControllerBase
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

        // 5. 反垃圾检查 (Spam Check)
        // 从配置中读取违禁词
        var spamKeywords = configuration.GetSection("SpamKeywords").Get<string[]>() ?? Array.Empty<string>();
        bool isSpam = spamKeywords.Any(k => safeContent.Contains(k, StringComparison.OrdinalIgnoreCase));
        
        // 如果是管理员，跳过检查
        bool isAdmin = User.IsInRole("Admin");

        // 如果命中敏感词且非管理员，强制设为待审核
        if (isSpam && !isAdmin)
        {
            comment.IsApproved = false;
        }

        // 6. 保存评论
        await commentService.AddCommentAsync(comment);

        // 7. 发送邮件通知
        // 获取文章标题
        var post = await context.Posts.AsNoTracking().FirstOrDefaultAsync(p => p.Id == comment.PostId);
        var postTitle = post?.Title ?? "未命名文章";

        // Case A: 待审核通知 (发给管理员)
        if (!comment.IsApproved)
        {
            var adminEmail = configuration["SmtpSettings:AdminEmail"];
            if (!string.IsNullOrEmpty(adminEmail))
            {
                string subject = $"[待审核] 新评论需处理：{postTitle}";
                string body = $@"
                    <p>有一条新评论触发了敏感词拦截，请审核：</p>
                    <p><strong>文章：</strong> {postTitle}</p>
                    <p><strong>用户：</strong> {comment.GuestName}</p>
                    <p><strong>内容：</strong></p>
                    <blockquote>{comment.Content}</blockquote>
                    <p><a href=""{Request.Scheme}://{Request.Host}/admin/comments"">前往审核</a></p>
                ";
                // 不等待邮件发送，以免阻塞接口
                _ = emailService.SendEmailAsync(adminEmail, subject, body);
            }
        }
        // Case B: 回复通知 (发给被回复的用户，前提是评论已通过)
        else if (comment.ParentId.HasValue)
        {
            var parentComment = await context.Comments.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == comment.ParentId.Value);
            if (parentComment != null)
            {
                string? recipientEmail = null;
                string recipientName = parentComment.GuestName ?? "匿名访客"; // 默认收件人名称
                
                // 优先使用注册用户的邮箱
                if (parentComment.User != null && !string.IsNullOrWhiteSpace(parentComment.User.Email))
                {
                    recipientEmail = parentComment.User.Email;
                    recipientName = parentComment.User.Username;
                }
                // 其次使用匿名用户的邮箱
                else if (!string.IsNullOrWhiteSpace(parentComment.GuestEmail))
                {
                    recipientEmail = parentComment.GuestEmail;
                }

                if (!string.IsNullOrWhiteSpace(recipientEmail))
                {
                    string subject = $"您的评论在 [{postTitle}] 获得新回复！";
                    string body = $@"
                        <p>亲爱的 {recipientName}，</p>
                        <p>您在文章 <strong>&quot;{postTitle}&quot;</strong> 下的评论有了新的回复：</p>
                        <blockquote>
                            <p>{comment.Content}</p>
                        </blockquote>
                        <p>点击这里查看完整对话：<a href=""{Request.Scheme}://{Request.Host}/posts/{comment.PostId}#comment-{comment.Id}"">查看评论</a></p>
                        <p>期待您的再次访问！</p>
                        <p>MyNextBlog 团队</p>
                    ";
                    _ = emailService.SendEmailAsync(recipientEmail, subject, body);
                }
            }
        }


        // 8. 返回创建成功的评论对象
        // 注意：如果被反垃圾拦截(IsApproved=false)，前端展示时需要提示用户“评论待审核”
        return Ok(new
        {
            success = true,
            comment = MapToDto(comment),
            message = comment.IsApproved ? "评论发表成功" : "评论包含敏感词，已进入人工审核队列"
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
                PostTitle = c.Post?.Title, // 需要在 Service Include Post
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