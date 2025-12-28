using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using MyNextBlog.Data;
using MyNextBlog.Models;
using Ganss.Xss;
using MyNextBlog.Services.Email;
using Microsoft.Extensions.Logging;

namespace MyNextBlog.Services;

public class CommentService(
    AppDbContext context,
    IHtmlSanitizer sanitizer,
    IConfiguration configuration,
    IMemoryCache cache,
    ILogger<CommentService> logger,
    IServiceScopeFactory scopeFactory) : ICommentService
{
    private const int RateLimitSeconds = 60;

    /// <summary>
    /// 检查 IP 是否被频率限制 (60秒内只能发一条)
    /// </summary>
    public bool IsRateLimited(string ipAddress)
    {
        string cacheKey = $"comment_rate_limit_{ipAddress}";
        if (cache.TryGetValue(cacheKey, out _))
            return true;
        
        cache.Set(cacheKey, true, TimeSpan.FromSeconds(RateLimitSeconds));
        return false;
    }

    public async Task<CommentCreationResult> CreateCommentAsync(int postId, string content, string? guestName, int? parentId, int? userId)
    {
        if (string.IsNullOrWhiteSpace(content))
            return new CommentCreationResult(false, "评论内容不能为空", null);

        var safeContent = sanitizer.Sanitize(content);
        if (string.IsNullOrWhiteSpace(safeContent))
            return new CommentCreationResult(false, "评论内容包含非法字符", null);

        User? user = null;
        if (userId.HasValue)
        {
            user = await context.Users.FindAsync(userId.Value);
        }

        var comment = new Comment
        {
            PostId = postId,
            Content = safeContent,
            CreateTime = DateTime.UtcNow, // 使用 UTC 时间，前端负责本地化显示
            ParentId = parentId,
            GuestName = guestName
        };

        if (user != null)
        {
            comment.UserId = user.Id;
            comment.GuestName = user.Username; 
        }
        else
        {
             comment.GuestName = string.IsNullOrWhiteSpace(guestName) ? "匿名访客" : guestName;
        }

        // Spam Check
        var spamKeywords = configuration.GetSection("SpamKeywords").Get<string[]>() ?? Array.Empty<string>();
        bool isSpam = spamKeywords.Any(k => safeContent.Contains(k, StringComparison.OrdinalIgnoreCase));
        
        bool isAdmin = user?.Role == "Admin";

        if (isSpam && !isAdmin)
        {
            comment.IsApproved = false;
        }

        context.Comments.Add(comment);
        await context.SaveChangesAsync();

        // Fire-and-Forget with new scope to avoid DbContext disposed issue
        // 捕获必要的值（使用不同变量名避免与参数冲突）
        var savedCommentId = comment.Id;
        var savedPostId = comment.PostId;
        var savedGuestName = comment.GuestName;
        var savedContent = comment.Content;
        var savedParentId = comment.ParentId;
        var savedIsApproved = comment.IsApproved;
        var savedUserId = comment.UserId;
        
        _ = Task.Run(async () =>
        {
            try 
            { 
                // 创建新的 DI 作用域，获取新的 DbContext 实例
                using var scope = scopeFactory.CreateScope();
                var scopedContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var scopedEmailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                var scopedTemplateService = scope.ServiceProvider.GetRequiredService<IEmailTemplateService>();
                
                await SendNotificationsAsync(scopedContext, scopedEmailService, scopedTemplateService, savedCommentId, savedPostId, savedGuestName, savedContent, savedParentId, savedIsApproved, savedUserId); 
            }
            catch (Exception ex) 
            { 
                logger.LogError(ex, "Background notification failed for comment {CommentId}", savedCommentId); 
            }
        });

        string message = comment.IsApproved ? "评论发表成功" : "评论包含敏感词，已进入人工审核队列";
        return new CommentCreationResult(true, message, comment);
    }

    private async Task SendNotificationsAsync(
        AppDbContext scopedContext, 
        IEmailService scopedEmailService,
        IEmailTemplateService scopedTemplateService,
        int commentId,
        int postId,
        string? guestName,
        string content,
        int? parentId,
        bool isApproved,
        int? userId)
    {
        try 
        {
            var post = await scopedContext.Posts.AsNoTracking().FirstOrDefaultAsync(p => p.Id == postId);
            var postTitle = post?.Title ?? "未命名文章";
            var appUrl = configuration["AppUrl"]?.TrimEnd('/') ?? "http://localhost:3000";
            var adminEmail = configuration["SmtpSettings:AdminEmail"];
            
            // 获取用户信息（如果有）
            User? user = null;
            string? commenterEmail = null;
            if (userId.HasValue)
            {
                user = await scopedContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
                commenterEmail = user?.Email;
            }
            
            // 预先查询父评论（如果是回复），避免后续重复查询
            Comment? parentComment = null;
            string? parentRecipientEmail = null;
            if (parentId.HasValue)
            {
                parentComment = await scopedContext.Comments
                    .Include(c => c.User)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.Id == parentId.Value);
                
                if (parentComment != null)
                {
                    parentRecipientEmail = parentComment.User?.Email ?? parentComment.GuestEmail;
                }
            }
            
            if (!isApproved)
            {
                if (!string.IsNullOrEmpty(adminEmail))
                {
                    var rendered = await scopedTemplateService.RenderAsync("spam_comment", new Dictionary<string, string>
                    {
                        ["PostTitle"] = postTitle,
                        ["Content"] = content,
                        ["GuestName"] = guestName ?? "Unknown",
                        ["AppUrl"] = appUrl
                    });
                    
                    if (rendered.HasValue)
                    {
                        await scopedEmailService.SendEmailAsync(adminEmail, rendered.Value.Subject, rendered.Value.Body);
                    }
                }
            }
            else
            {
                // 正常评论通知站长（排除：评论者是站长 OR 被回复者是站长）
                // 如果被回复者是站长，会通过 reply_notification 收到邮件，无需发 new_comment
                bool shouldNotifyAdmin = !string.IsNullOrEmpty(adminEmail) 
                    && commenterEmail != adminEmail
                    && parentRecipientEmail != adminEmail;
                    
                if (shouldNotifyAdmin)
                {
                    var rendered = await scopedTemplateService.RenderAsync("new_comment", new Dictionary<string, string>
                    {
                        ["PostTitle"] = postTitle,
                        ["Content"] = content,
                        ["GuestName"] = guestName ?? "Unknown",
                        ["PostId"] = postId.ToString(),
                        ["CommentId"] = commentId.ToString(),
                        ["AppUrl"] = appUrl
                    });
                    
                    if (rendered.HasValue)
                    {
                        await scopedEmailService.SendEmailAsync(adminEmail, rendered.Value.Subject, rendered.Value.Body);
                    }
                }
            }


            // 回复评论通知被回复者（复用上面已查询的 parentComment）
            if (parentComment != null && isApproved)
            {
                string? recipientEmail = null;
                string recipientName = parentComment.GuestName ?? "匿名访客";
                
                if (parentComment.User != null && !string.IsNullOrWhiteSpace(parentComment.User.Email))
                {
                    recipientEmail = parentComment.User.Email;
                    recipientName = parentComment.User.Username;
                }
                else if (!string.IsNullOrWhiteSpace(parentComment.GuestEmail))
                {
                    recipientEmail = parentComment.GuestEmail;
                }

                if (!string.IsNullOrWhiteSpace(recipientEmail))
                {
                    var rendered = await scopedTemplateService.RenderAsync("reply_notification", new Dictionary<string, string>
                    {
                        ["RecipientName"] = recipientName,
                        ["PostTitle"] = postTitle,
                        ["Content"] = content,
                        ["GuestName"] = guestName ?? "Unknown",
                        ["PostId"] = postId.ToString(),
                        ["CommentId"] = commentId.ToString(),
                        ["AppUrl"] = appUrl
                    });
                    
                    if (rendered.HasValue)
                    {
                        await scopedEmailService.SendEmailAsync(recipientEmail, rendered.Value.Subject, rendered.Value.Body);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending notification for comment {CommentId}", commentId);
        }
    }

    public async Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize)
    {
        // 1. 获取该文章所有已审核的评论（扁平化加载）
        var allComments = await context.Comments
            .AsNoTracking()
            .Include(c => c.User)
            .Where(c => c.PostId == postId && c.IsApproved)
            .ToListAsync();

        // 2. 在内存中构建树形结构
        var rootComments = BuildCommentTree(allComments);

        // 3. 分页（只对根评论分页）
        return rootComments
            .OrderByDescending(c => c.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
    }

    /// <summary>
    /// 在内存中构建评论树形结构（支持无限层嵌套）
    /// </summary>
    private static List<Comment> BuildCommentTree(List<Comment> flatComments)
    {
        // 创建 ParentId -> Children 的查找表
        var lookup = flatComments.ToLookup(c => c.ParentId);
        
        // 为每个评论填充其子评论
        foreach (var comment in flatComments)
        {
            comment.Children = lookup[comment.Id].OrderBy(c => c.CreateTime).ToList();
        }
        
        // 返回根评论（ParentId == null）
        return flatComments.Where(c => c.ParentId == null).ToList();
    }

    public async Task<int> GetCommentCountAsync(int postId)
    {
        return await context.Comments.CountAsync(c => c.PostId == postId && c.ParentId == null && c.IsApproved);
    }

    public async Task<(List<Comment> Comments, int TotalCount)> GetAllCommentsForAdminAsync(int page, int pageSize, bool? isApproved)
    {
        var query = context.Comments
            .AsNoTracking()
            .Include(c => c.Post)
            .Include(c => c.User)
            .AsQueryable();

        if (isApproved.HasValue)
        {
            query = query.Where(c => c.IsApproved == isApproved.Value);
        }

        var totalCount = await query.CountAsync();
        
        var comments = await query
            .OrderByDescending(c => c.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (comments, totalCount);
    }

    public async Task<bool> ToggleApprovalAsync(int id)
    {
        var comment = await context.Comments.FindAsync(id);
        if (comment == null) return false;

        comment.IsApproved = !comment.IsApproved;
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteCommentAsync(int id)
    {
        var comment = await context.Comments.FindAsync(id);
        if (comment == null) return false;

        context.Comments.Remove(comment);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<int> BatchApproveAsync(List<int> ids)
    {
        var comments = await context.Comments.Where(c => ids.Contains(c.Id) && !c.IsApproved).ToListAsync();
        if (!comments.Any()) return 0;

        foreach (var c in comments)
        {
            c.IsApproved = true;
        }
        return await context.SaveChangesAsync();
    }

    public async Task<int> BatchDeleteAsync(List<int> ids)
    {
        var comments = await context.Comments.Where(c => ids.Contains(c.Id)).ToListAsync();
        if (!comments.Any()) return 0;

        context.Comments.RemoveRange(comments);
        return await context.SaveChangesAsync();
    }
}
