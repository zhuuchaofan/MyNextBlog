// ============================================================================
// Services/CommentService.cs - 评论服务实现
// ============================================================================
// 此服务负责博客评论的核心业务逻辑，包括：
//   - 评论的创建、审核、删除
//   - 频率限制 (Rate Limiting) 防止 Spam
//   - 敏感词过滤和 XSS 防护
//   - 评论树形结构构建 (支持无限层嵌套)
//
// **安全特性**:
//   - 使用 HtmlSanitizer 过滤 XSS 攻击
//   - IP 级别的频率限制 (60 秒内只能发表一条)
//   - 敏感词自动进入审核队列
//
// **架构重构 (2026-01-01)**:
//   - 邮件通知逻辑已迁移到 `ICommentNotificationService`
//   - 移除 `IServiceScopeFactory` 隐性依赖
//   - 符合单一职责原则 (SRP)

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;           // EF Core 数据库操作
using Microsoft.Extensions.Caching.Memory;      // 内存缓存 (用于频率限制)
using Microsoft.Extensions.DependencyInjection; // DI 容器 (用于后台任务作用域)
using MyNextBlog.Data;                          // 数据访问层
using MyNextBlog.Models;                        // 领域模型
using MyNextBlog.DTOs;                          // 数据传输对象
using MyNextBlog.Mappers;                       // DTO 映射
using Ganss.Xss;                                // HtmlSanitizer 库 (XSS 防护)
using Microsoft.Extensions.Logging;             // 日志

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `CommentService` 是评论模块的核心业务服务类，实现 `ICommentService` 接口。
/// 
/// **主要职责**:
///   - 评论 CRUD 操作
///   - 安全过滤 (XSS、敏感词)
///   - 构建评论树形结构
/// 
/// **依赖注入**:
///   - `AppDbContext`: 数据库上下文
///   - `IHtmlSanitizer`: XSS 过滤器
///   - `IMemoryCache`: 频率限制缓存
///   - `ICommentNotificationService`: 评论通知服务 (显式依赖)
/// 
/// **注意**: 邮件通知逻辑已迁移到 `ICommentNotificationService`
/// </summary>
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

        // 3. 执行后台通知任务（Fire-and-Forget）
        // ✅ 重构后：使用显式注入的 ICommentNotificationService
        // ❌ 重构前：使用 IServiceScopeFactory 手动解析服务（隐性依赖）
        var commentId = comment.Id;
        _ = Task.Run(async () =>
        {
            try 
            { 
                // 创建新的作用域以获取新的 DbContext 实例（避免 DbContext 已被释放的问题）
                using var scope = scopeFactory.CreateScope();
                var scopedNotificationService = scope.ServiceProvider.GetRequiredService<ICommentNotificationService>();
                await scopedNotificationService.SendNotificationsAsync(commentId); 
            }
            catch (Exception ex) 
            { 
                logger.LogError(ex, "Background notification failed for comment {CommentId}", commentId); 
            }
        });

        string message = comment.IsApproved ? "评论发表成功" : "评论包含敏感词，已进入人工审核队列";
        return new CommentCreationResult(true, message, comment);
    }

    public async Task<List<CommentDto>> GetCommentsAsync(int postId, int page, int pageSize)
    {
        // 防御性检查：防止负数导致 Skip() 抛出异常
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        
        // 1. 获取该文章所有已审核的评论（扁平化加载）
        var allComments = await context.Comments
            .AsNoTracking()
            .Include(c => c.User)
            .Where(c => c.PostId == postId && c.IsApproved)
            .ToListAsync();

        // 2. 在内存中构建树形结构
        var rootComments = BuildCommentTree(allComments);

        // 3. 分页（只对根评论分页）并映射到 DTO
        return rootComments
            .OrderByDescending(c => c.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(CommentMappers.ToDto)
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

    public async Task<(List<AdminCommentDto> Comments, int TotalCount)> GetAllCommentsForAdminAsync(int page, int pageSize, bool? isApproved)
    {
        // 防御性检查：防止负数导致 Skip() 抛出异常
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        
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

        // 映射到 AdminCommentDto
        var dtos = comments.Select(CommentMappers.ToAdminDto).ToList();
        return (dtos, totalCount);
    }

    public async Task<bool> ToggleApprovalAsync(int id)
    {
        var comment = await context.Comments.FindAsync(id);
        if (comment == null) return false;

        comment.IsApproved = !comment.IsApproved;
        await context.SaveChangesAsync();
        
        logger.LogInformation(
            "Comment approval toggled: CommentId={CommentId}, IsApproved={IsApproved}",
            id, comment.IsApproved
        );
        
        return true;
    }

    public async Task<bool> DeleteCommentAsync(int id)
    {
        var comment = await context.Comments.FindAsync(id);
        if (comment == null) return false;

        logger.LogInformation(
            "Deleting comment: CommentId={CommentId}, Author={Author}",
            id, comment.GuestName ?? "User"
        );

        context.Comments.Remove(comment);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<int> BatchApproveAsync(List<int> ids)
    {
        var comments = await context.Comments.Where(c => ids.Contains(c.Id) && !c.IsApproved).ToListAsync();
        if (!comments.Any()) return 0;

        logger.LogInformation(
            "Batch approving comments: Count={Count}, CommentIds={CommentIds}",
            comments.Count, string.Join(", ", ids)
        );

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
