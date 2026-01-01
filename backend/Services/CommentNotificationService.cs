// ============================================================================
// Services/CommentNotificationService.cs - 评论通知服务实现
// ============================================================================
// 此服务负责评论相关的邮件通知，原逻辑从 CommentService.SendNotificationsAsync 迁移而来。
//
// **架构修复**: 
//   - 将通知逻辑从 CommentService 中分离，遵循 SRP
//   - 消除隐性依赖（不再需要 IServiceScopeFactory 手动解析服务）
//   - 所有依赖在构造函数中显式声明

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;      // EF Core 数据库操作
using Microsoft.Extensions.Configuration; // 配置读取
using Microsoft.Extensions.Logging;       // 日志
using MyNextBlog.Data;                    // 数据访问层
using MyNextBlog.Services.Email;          // 邮件服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `CommentNotificationService` 是评论通知模块的服务类，实现 `ICommentNotificationService` 接口。
/// 
/// **主要功能**:
///   - 新评论通知站长
///   - 敏感词评论通知站长审核
///   - 回复通知被回复者
/// 
/// **重构来源**:
///   - 原 `CommentService.SendNotificationsAsync()` 私有方法
/// 
/// **显式依赖** (vs 原来的隐性依赖):
///   - IEmailService: 邮件发送
///   - IEmailTemplateService: 邮件模板渲染
///   - AppDbContext: 数据库读取
///   - IConfiguration: 配置读取
/// </summary>
public class CommentNotificationService(
    AppDbContext context,
    IEmailService emailService,
    IEmailTemplateService templateService,
    IConfiguration configuration,
    ILogger<CommentNotificationService> logger) : ICommentNotificationService
{
    /// <summary>
    /// 发送评论相关的所有通知
    /// </summary>
    /// <param name="commentId">评论 ID</param>
    public async Task SendNotificationsAsync(int commentId)
    {
        try 
        {
            // 1. 一次性加载所有关联数据
            var comment = await context.Comments
                .Include(c => c.Post)
                .Include(c => c.User)
                .Include(c => c.Parent)
                    .ThenInclude(p => p!.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null)
            {
                logger.LogWarning("Notification skipped: Comment {CommentId} not found.", commentId);
                return;
            }

            var post = comment.Post;
            if (post == null)
            {
                 logger.LogWarning("Notification skipped: Post not found for comment {CommentId}.", commentId);
                 return;
            }

            // 2. 提取所需数据
            var postId = post.Id;
            var postTitle = post.Title;
            var guestName = comment.GuestName;
            var content = comment.Content;
            var isApproved = comment.IsApproved;
            var parentComment = comment.Parent;

            var appUrl = configuration["AppUrl"]?.TrimEnd('/') ?? "http://localhost:3000";
            var adminEmail = configuration["SmtpSettings:AdminEmail"];
            
            // 获取评论者邮箱
            string? commenterEmail = comment.User?.Email ?? comment.GuestEmail;
            
            string? parentRecipientEmail = null;
            if (parentComment != null)
            {
                parentRecipientEmail = parentComment.User?.Email ?? parentComment.GuestEmail;
            }
            
            // 3. 根据评论状态发送不同通知
            if (!isApproved)
            {
                // 敏感词评论 → 通知站长审核
                await SendSpamNotificationAsync(adminEmail, postTitle, content, guestName, appUrl);
            }
            else
            {
                // 正常评论 → 通知站长（排除自己评论自己）
                await SendNewCommentNotificationAsync(
                    adminEmail, commenterEmail, parentRecipientEmail,
                    postTitle, content, guestName, postId, commentId, appUrl);
            }

            // 4. 回复通知（仅限已审核的回复）
            if (parentComment != null && isApproved)
            {
                await SendReplyNotificationAsync(
                    parentComment, postTitle, content, guestName, postId, commentId, appUrl);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error sending notification for comment {CommentId}", commentId);
        }
    }
    
    /// <summary>
    /// 发送敏感词审核通知给站长
    /// </summary>
    private async Task SendSpamNotificationAsync(
        string? adminEmail, string postTitle, string content, string? guestName, string appUrl)
    {
        if (string.IsNullOrEmpty(adminEmail)) return;
        
        var rendered = await templateService.RenderAsync("spam_comment", new Dictionary<string, string>
        {
            ["PostTitle"] = postTitle,
            ["Content"] = content,
            ["GuestName"] = guestName ?? "Unknown",
            ["AppUrl"] = appUrl
        });
        
        if (rendered.HasValue)
        {
            await emailService.SendEmailAsync(adminEmail, rendered.Value.Subject, rendered.Value.Body);
            logger.LogInformation("Spam comment notification sent to admin: {Email}", adminEmail);
        }
    }
    
    /// <summary>
    /// 发送新评论通知给站长
    /// </summary>
    private async Task SendNewCommentNotificationAsync(
        string? adminEmail, string? commenterEmail, string? parentRecipientEmail,
        string postTitle, string content, string? guestName,
        int postId, int commentId, string appUrl)
    {
        // 排除：评论者是站长 OR 被回复者是站长（站长会收到 reply_notification）
        bool shouldNotifyAdmin = !string.IsNullOrEmpty(adminEmail) 
            && commenterEmail != adminEmail
            && parentRecipientEmail != adminEmail;
            
        if (!shouldNotifyAdmin) return;
        
        var rendered = await templateService.RenderAsync("new_comment", new Dictionary<string, string>
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
            await emailService.SendEmailAsync(adminEmail!, rendered.Value.Subject, rendered.Value.Body);
            logger.LogInformation("New comment notification sent to admin: {Email}", adminEmail);
        }
    }
    
    /// <summary>
    /// 发送回复通知给被回复者
    /// </summary>
    private async Task SendReplyNotificationAsync(
        Models.Comment parentComment,
        string postTitle, string content, string? guestName,
        int postId, int commentId, string appUrl)
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

        if (string.IsNullOrWhiteSpace(recipientEmail)) return;
        
        var rendered = await templateService.RenderAsync("reply_notification", new Dictionary<string, string>
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
            await emailService.SendEmailAsync(recipientEmail, rendered.Value.Subject, rendered.Value.Body);
            logger.LogInformation("Reply notification sent to: {Email}", recipientEmail);
        }
    }
}
