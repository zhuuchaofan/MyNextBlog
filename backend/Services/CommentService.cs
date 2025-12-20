using Microsoft.EntityFrameworkCore;
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
    IEmailService emailService,
    ILogger<CommentService> logger) : ICommentService
{
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
            CreateTime = DateTime.Now,
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

        _ = SendNotificationsAsync(comment);

        string message = comment.IsApproved ? "评论发表成功" : "评论包含敏感词，已进入人工审核队列";
        return new CommentCreationResult(true, message, comment);
    }

    private async Task SendNotificationsAsync(Comment comment)
    {
        try 
        {
            var post = await context.Posts.AsNoTracking().FirstOrDefaultAsync(p => p.Id == comment.PostId);
            var postTitle = post?.Title ?? "未命名文章";
            var appUrl = configuration["AppUrl"]?.TrimEnd('/');
            var adminEmail = configuration["SmtpSettings:AdminEmail"];

            if (!comment.IsApproved)
            {
                if (!string.IsNullOrEmpty(adminEmail))
                {
                    string subject = $"🚨 [待审核] 敏感词拦截：{postTitle}";
                    string body = $@"
                        <div style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px; background-color: #ffffff;'>
                            <div style='border-bottom: 2px solid #d73a49; padding-bottom: 15px; margin-bottom: 20px;'>
                                <h2 style='margin: 0; color: #d73a49; font-size: 20px;'>⚠️ 新评论需审核</h2>
                            </div>
                            <div style='color: #24292e; line-height: 1.6;'>
                                <p><strong>文章：</strong> {postTitle}</p>
                                <p><strong>用户：</strong> {comment.GuestName}</p>
                                <div style='background-color: #fffbdd; border-left: 4px solid #d73a49; padding: 15px; margin: 15px 0; color: #586069;'>
                                    {comment.Content}
                                </div>
                            </div>
                            <div style='margin-top: 25px; text-align: center;'>
                                <a href='{appUrl}/admin/comments' style='display: inline-block; background-color: #d73a49; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>前往后台审核</a>
                            </div>
                            <div style='margin-top: 30px; font-size: 12px; color: #6a737d; text-align: center;'>
                                © MyNextBlog Automated System
                            </div>
                        </div>
                    ";
                    await emailService.SendEmailAsync(adminEmail, subject, body);
                }
            }
            else
            {
                // 3. 正常评论通知站长 (新增逻辑)
                // 只要是审核通过的评论，且发布者不是管理员自己（防止自己收到自己的邮件），都通知站长
                // 简单的判断：如果评论者邮箱不等于管理员邮箱（假设配置了）
                // 更严谨的判断需要 User Role，但这里我们尽量简化
                if (!string.IsNullOrEmpty(adminEmail))
                {
                     // 避免通知自己：如果当前评论者就是 AdminEmail，则不发
                     // 注意：这里 comment.GuestEmail 可能是空的，或者 comment.User.Email
                     var commenterEmail = comment.User?.Email ?? comment.GuestEmail;
                     
                     if (commenterEmail != adminEmail) 
                     {
                        string subject = $"💬 [新评论] {postTitle}";
                        string body = $@"
                            <div style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px; background-color: #ffffff;'>
                                <div style='border-bottom: 2px solid #0366d6; padding-bottom: 15px; margin-bottom: 20px;'>
                                    <h2 style='margin: 0; color: #0366d6; font-size: 20px;'>New Comment Notification</h2>
                                </div>
                                <div style='color: #24292e; line-height: 1.6;'>
                                    <p>您的文章 <strong>{postTitle}</strong> 收到了新的评论：</p>
                                    <div style='background-color: #f6f8fa; border-left: 4px solid #0366d6; padding: 15px; margin: 15px 0; color: #586069;'>
                                        {comment.Content}
                                    </div>
                                    <p style='font-size: 14px; color: #586069;'>By: <strong>{comment.GuestName}</strong></p>
                                </div>
                                <div style='margin-top: 25px; text-align: center;'>
                                    <a href='{appUrl}/posts/{comment.PostId}#comment-{comment.Id}' style='display: inline-block; background-color: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>查看详情</a>
                                </div>
                                <div style='margin-top: 30px; font-size: 12px; color: #6a737d; text-align: center;'>
                                    © MyNextBlog Automated System
                                </div>
                            </div>
                        ";
                         await emailService.SendEmailAsync(adminEmail, subject, body);
                     }
                }
            }

            // 恢复原本的 else if 逻辑，改为独立的 if，因为我们希望 Admin 和 被回复者 同时收到通知
            if (comment.ParentId.HasValue && comment.IsApproved)
            {
                var parentComment = await context.Comments.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == comment.ParentId.Value);
                if (parentComment != null)
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
                        string subject = $"👋 您的评论在 [{postTitle}] 收到了回复";
                        string body = $@"
                             <div style='font-family: -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px; background-color: #ffffff;'>
                                <div style='border-bottom: 2px solid #28a745; padding-bottom: 15px; margin-bottom: 20px;'>
                                    <h2 style='margin: 0; color: #28a745; font-size: 20px;'>New Reply</h2>
                                </div>
                                <div style='color: #24292e; line-height: 1.6;'>
                                    <p>亲爱的 <strong>{recipientName}</strong>，</p>
                                    <p>您在文章 <strong>{postTitle}</strong> 下的评论有了新的回复：</p>
                                    <div style='background-color: #f6f8fa; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; color: #586069;'>
                                        {comment.Content}
                                    </div>
                                    <p style='font-size: 14px; color: #586069;'>By: <strong>{comment.GuestName}</strong></p>
                                </div>
                                <div style='margin-top: 25px; text-align: center;'>
                                    <a href='{appUrl}/posts/{comment.PostId}#comment-{comment.Id}' style='display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>回复</a>
                                </div>
                                <div style='margin-top: 30px; font-size: 12px; color: #6a737d; text-align: center;'>
                                    © MyNextBlog Automated System
                                </div>
                            </div>
                        ";
                        await emailService.SendEmailAsync(recipientEmail, subject, body);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending notification for comment {CommentId}", comment.Id);
        }
    }

    public async Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize)
    {
        return await context.Comments
            .AsNoTracking()
            .Include(c => c.User)
            .Include(c => c.Children.Where(child => child.IsApproved)) // Filter children!
                .ThenInclude(r => r.User)
            .Where(c => c.PostId == postId && c.ParentId == null && c.IsApproved) // Only approved root comments
            .OrderByDescending(c => c.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
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
