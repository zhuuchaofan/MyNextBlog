// `using` 语句用于导入必要的命名空间，以便在当前文件中使用其中定义的类型。
using Microsoft.EntityFrameworkCore; // 引入 Entity Framework Core，用于数据库操作
using Microsoft.Extensions.Caching.Memory; // 引入内存缓存命名空间
using Microsoft.Extensions.Logging; // 引入日志命名空间
using MyNextBlog.Data;              // 引入数据访问层命名空间，包含 AppDbContext
using MyNextBlog.Models;            // 引入应用程序的领域模型，如 Post, Comment, Category 等
using MyNextBlog.DTOs;              // 引入 DTOs
using MyNextBlog.Helpers;           // 引入 Helpers (MarkdownHelper)

// `namespace` 声明了当前文件中的代码所属的命名空间。
namespace MyNextBlog.Services;

/// <summary>
/// `PostService` 是一个核心业务服务类，实现了 `IPostService` 接口。
/// 它的主要职责是封装与博客文章相关的各种业务逻辑和数据库操作，包括：
///   - 文章的增、删、改、查 (CRUD)
///   - 评论的管理
///   - 文章与分类、标签之间的关联查询
///   - 整合图片处理服务，确保文章中的图片资源得到正确管理
/// </summary>
// `public class PostService(...) : IPostService`
// 这是服务类的定义。
// `AppDbContext context, IImageService imageService, IMemoryCache cache`: 注入缓存服务
public class PostService(AppDbContext context, IImageService imageService, IMemoryCache cache, ITagService tagService, ILogger<PostService> logger) : IPostService
{
    private const string AllPostsCacheKey = "all_posts_public"; // 首页文章列表的缓存 Key
    
    // 常用的 pageSize 值（用于缓存清除）
    private static readonly int[] CommonPageSizes = [10, 20, 50, 100];
    
    /// <summary>
    /// 清除所有文章列表相关的缓存
    /// </summary>
    private void InvalidatePostListCache()
    {
        foreach (var pageSize in CommonPageSizes)
        {
            cache.Remove($"{AllPostsCacheKey}_False_{pageSize}");
            cache.Remove($"{AllPostsCacheKey}_True_{pageSize}");
        }
    }

    /// <summary>
    /// 获取文章列表 (数据库级分页)
    /// </summary>
    public async Task<(List<PostSummaryDto> Posts, int TotalCount)> GetAllPostsAsync(PostQueryDto query)
    {
        // 解构查询参数
        var (page, pageSize, includeHidden, categoryId, searchTerm, tagName) = query;
        
        // 0. 判断是否为"纯净首页"请求 (只有这种情况才值得缓存)
        // 防御性检查：防止负数导致 Skip() 抛出异常
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        // 🔧 修复缓存策略一致性：只有白名单内的 pageSize 才会被缓存
        // 原因：InvalidatePostListCache() 只清除 CommonPageSizes 定义的 Key
        // 如果允许任意 pageSize 进入缓存，非标准请求会产生"幽灵缓存"永远无法被清除
        bool isCacheable = page == 1 && 
                           !categoryId.HasValue && 
                           string.IsNullOrWhiteSpace(searchTerm) && 
                           string.IsNullOrWhiteSpace(tagName) &&
                           CommonPageSizes.Contains(pageSize);

        if (isCacheable)
        {
            // 🔧 修复：缓存 key 必须包含 pageSize，否则不同 pageSize 的请求会共享缓存
            // 例如：首页 pageSize=10 和归档页 pageSize=100 需要分开缓存
            string cacheKey = $"{AllPostsCacheKey}_{includeHidden}_{pageSize}";
            
            // 尝试获取缓存，如果不存在则执行后面的 Factory 方法查询并写入
            return await cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                // 设置相对过期时间：10分钟 (防止极端情况下的长期陈旧)
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                
                // 执行真正的数据库查询
                return await QueryPostsFromDbAsync();
            });
        }

        // 非缓存场景，直接查库
        return await QueryPostsFromDbAsync();

        // 内部查询函数 (复用逻辑)
        async Task<(List<PostSummaryDto>, int)> QueryPostsFromDbAsync()
        {
            var dbQuery = context.Posts.AsNoTracking().AsQueryable();
            
            // 排除已软删除的文章
            dbQuery = dbQuery.Where(p => !p.IsDeleted);

            if (!includeHidden) dbQuery = dbQuery.Where(p => !p.IsHidden);
            if (categoryId.HasValue) dbQuery = dbQuery.Where(p => p.CategoryId == categoryId.Value);
            if (!string.IsNullOrWhiteSpace(searchTerm)) dbQuery = dbQuery.Where(p => p.Title.Contains(searchTerm) || p.Content.Contains(searchTerm));
            if (!string.IsNullOrWhiteSpace(tagName)) dbQuery = dbQuery.Where(p => p.Tags.Any(t => t.Name == tagName));

            var total = await dbQuery.CountAsync();
            
            // 1. 先查出数据 (Projection to Anonymous Type)
            // 这样既能避免 SELECT 全字段，又能享受 EF Core 的部分转换能力
            var data = await dbQuery
                .OrderByDescending(p => p.CreateTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new 
                {
                    p.Id,
                    p.Title,
                    // 此处截取前 300 字符用于生成摘要和提取封面图
                    // 注意：SQLite/SQLServer 都支持 Substring 翻译
                    Content = p.Content.Length > 300 ? p.Content.Substring(0, 300) : p.Content,
                    p.CreateTime,
                    p.UpdatedAt,
                    p.IsHidden,
                    p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : "Uncategorized",
                    p.User, // User 对象可能包含 AvatarUrl
                    UserId = p.UserId,
                    UserName = p.User != null ? (p.User.Nickname ?? p.User.Username) : "Unknown",
                    UserAvatar = p.User != null ? p.User.AvatarUrl : null,
                    Tags = p.Tags.Select(t => t.Name).ToList(),
                    p.LikeCount,
                    SeriesName = p.Series != null ? p.Series.Name : null,
                    p.SeriesId,
                    p.SeriesOrder
                })
                .ToListAsync();

            // 2. 计算每篇文章在所属系列中的可见序号
            var seriesIds = data.Where(p => p.SeriesId.HasValue).Select(p => p.SeriesId!.Value).Distinct().ToList();
            var visibleSeriesOrders = await CalculateVisibleSeriesOrdersAsync(seriesIds);

            // 3. 在内存中映射为 DTO
            var dtos = data.Select(p => new PostSummaryDto(
                p.Id,
                p.Title,
                // 摘要生成 (再截取一下确保是 150-200 左右，或者直接用 DB 返回的)
                // 这里我们简单处理，只是加个 "..." 如果确实很长
                p.Content.Length > 150 ? p.Content.Substring(0, 150) + "..." : p.Content,
                p.CategoryName,
                p.CategoryId,
                p.UserName,
                p.UserAvatar,
                p.CreateTime,
                p.UpdatedAt,
                MarkdownHelper.GetCoverImage(p.Content), // 从前300字符中提取图片
                p.Tags,
                p.IsHidden,
                p.LikeCount,
                p.SeriesName,
                // 使用计算后的可见序号，如果没有则为 0
                visibleSeriesOrders.GetValueOrDefault(p.Id, 0)
            )).ToList();

            return (dtos, total);
        }
    }

    /// <summary>
    /// 计算一组系列中所有文章的可见序号
    /// </summary>
    private async Task<Dictionary<int, int>> CalculateVisibleSeriesOrdersAsync(List<int> seriesIds)
    {
        if (!seriesIds.Any()) return new Dictionary<int, int>();

        // 一次性查询所有相关系列的可见文章
        var seriesPostsMap = await context.Posts
            .AsNoTracking()
            .Where(p => p.SeriesId.HasValue && seriesIds.Contains(p.SeriesId.Value) && !p.IsHidden && !p.IsDeleted)
            .OrderBy(p => p.SeriesOrder)
            .Select(p => new { p.Id, SeriesId = p.SeriesId!.Value })
            .ToListAsync();

        // 按系列分组，计算每篇文章的可见序号
        var result = new Dictionary<int, int>();
        var groupedBySeries = seriesPostsMap.GroupBy(p => p.SeriesId);
        
        foreach (var group in groupedBySeries)
        {
            var orderedPosts = group.ToList();
            for (int i = 0; i < orderedPosts.Count; i++)
            {
                result[orderedPosts[i].Id] = i + 1; // 1-based index
            }
        }

        return result;
    }

    /// <summary>
    /// `GetPostByIdAsync` 方法用于根据文章的唯一 ID 获取单篇文章的详细信息。
    /// </summary>
    /// <param name="id">要查询的文章的整数 ID。</param>
    /// <param name="includeHidden">布尔值，如果为 `true`，则允许查询隐藏文章；否则，如果文章是隐藏的，将无法被查到。</param>
    /// <returns>返回一个 `Task<Post?>`。如果找到了符合条件的文章，则返回 `Post` 实体对象；否则返回 `null`。</returns>
    public async Task<Post?> GetPostByIdAsync(int id, bool includeHidden = false)
    {
        var query = context.Posts.AsNoTracking().AsQueryable();
        
        // 排除已软删除的文章
        query = query.Where(p => !p.IsDeleted);

        if (!includeHidden)
        {
            query = query.Where(p => !p.IsHidden);
        }

        var post = await query
            .Include(p => p.Category)
            .Include(p => p.User)
            .Include(p => p.Tags)
            .Include(p => p.Series) // Include Series
            .FirstOrDefaultAsync(m => m.Id == id);
            
        return post;
    }
    
    // Helper to get series info (used by Controller)
    public async Task<PostSeriesDto?> GetSeriesInfoForPostAsync(int postId, int? seriesId, int currentOrder)
    {
        if (!seriesId.HasValue) return null;

        var series = await context.Series.FindAsync(seriesId.Value);
        if (series == null) return null;

        // Fetch all posts in the series (lightweight projection)
        // Order by SeriesOrder
        var siblings = await context.Posts
            .AsNoTracking()
            .Where(p => p.SeriesId == seriesId && !p.IsHidden && !p.IsDeleted) // Exclude hidden and deleted
            .OrderBy(p => p.SeriesOrder)
            .Select(p => new { p.Id, p.Title, p.SeriesOrder })
            .ToListAsync();

        var totalCount = siblings.Count;
        var currentIndex = siblings.FindIndex(p => p.Id == postId);
        
        // If post is not found in the list (e.g. it's hidden but we're viewing it as admin?), handle gracefully
        if (currentIndex == -1) return null;
        
        // Display order is 1-based index (Index + 1) OR use SeriesOrder if it's strict?
        // Let's use Index + 1 for "Part X of Y" logic to be continuous even if Orders are 10, 20, 30.
        var currentDisplayOrder = currentIndex + 1;

        PostLinkDto? prev = null;
        if (currentIndex > 0)
        {
            var p = siblings[currentIndex - 1];
            prev = new PostLinkDto(p.Id, p.Title);
        }

        PostLinkDto? next = null;
        if (currentIndex < siblings.Count - 1)
        {
            var p = siblings[currentIndex + 1];
            next = new PostLinkDto(p.Id, p.Title);
        }

        return new PostSeriesDto(
            series.Id,
            series.Name,
            totalCount,
            currentDisplayOrder,
            prev,
            next
        );
    }

    /// <summary>
    /// 获取用于更新的文章实体 (开启追踪)
    /// </summary>
    /// <remarks>
    /// 专门用于 Update 操作。必须开启追踪 (不使用 AsNoTracking)，
    /// 并且必须 Include Tags，这样 EF Core 才能正确处理标签集合的变更（识别新增、删除和保留的标签）。
    /// </remarks>
    public async Task<Post?> GetPostForUpdateAsync(int id)
    {
        return await context.Posts
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    /// <summary>
    /// `AddPostAsync` 方法用于在数据库中创建一篇新的文章记录。
    /// </summary>
    public async Task<Post> AddPostAsync(CreatePostDto dto, int? userId)
    {
        logger.LogInformation(
            "Creating post: {Title} by UserId={UserId}, CategoryId={CategoryId}, Tags={TagCount}",
            dto.Title, userId ?? 0, dto.CategoryId, dto.Tags?.Count ?? 0
        );
        
        var post = new Post
        {
            Title = dto.Title,
            Content = dto.Content,
            CategoryId = dto.CategoryId,
            UserId = userId,
            SeriesId = dto.SeriesId,
            SeriesOrder = dto.SeriesOrder,
            IsHidden = dto.IsHidden, // 支持保存为草稿
            CreateTime = DateTime.UtcNow
        };

        if (dto.Tags != null && dto.Tags.Any())
        {
            post.Tags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
        }

        context.Add(post);
        await context.SaveChangesAsync();
        
        await imageService.AssociateImagesAsync(post.Id, post.Content);

        // 清除首页列表缓存 (包括普通用户和管理员的)
        InvalidatePostListCache();

        logger.LogInformation("Post created successfully: PostId={PostId}", post.Id);
        return post;
    }

    public async Task<Post> UpdatePostAsync(int id, UpdatePostDto dto)
    {
        logger.LogInformation(
            "Updating post: PostId={PostId}, NewTitle={Title}, IsHidden={IsHidden}",
            id, dto.Title, dto.IsHidden
        );
        
        var post = await GetPostForUpdateAsync(id);
        if (post == null) throw new ArgumentException("文章不存在");

        post.Title = dto.Title;
        post.Content = dto.Content;
        post.CategoryId = dto.CategoryId;
        post.IsHidden = dto.IsHidden;
        post.SeriesId = dto.SeriesId;
        post.SeriesOrder = dto.SeriesOrder;
        post.UpdatedAt = DateTime.UtcNow; // 自动记录修改时间

        post.Tags.Clear();
        if (dto.Tags != null && dto.Tags.Any())
        {
            var newTags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
            post.Tags.AddRange(newTags);
        }

        context.Update(post);
        await context.SaveChangesAsync();

        await imageService.AssociateImagesAsync(post.Id, post.Content);

        InvalidatePostListCache();

        logger.LogInformation("Post updated successfully: PostId={PostId}", id);
        return post;
    }

    /// <summary>
    /// 软删除文章 - 将文章移至回收站
    /// </summary>
    public async Task DeletePostAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post != null)
        {
            logger.LogInformation("Soft deleting post: PostId={PostId}, Title={Title}", id, post.Title);
            
            post.IsDeleted = true;
            post.DeletedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            // 清除首页列表缓存
            InvalidatePostListCache();
            
            logger.LogInformation("Post moved to trash: PostId={PostId}", id);
        }
    }

    /// <summary>
    /// GetCategoriesAsync 方法用于获取数据库中所有可用的文章分类。
    /// </summary>
    /// <returns>返回包含所有分类 DTO 的列表。</returns>
    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        // 使用 Projection 直接映射到 DTO，避免 Entity 泄露
        return await context.Categories
            .AsNoTracking()
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToListAsync();
    }

    /// <summary>
    /// TogglePostVisibilityAsync 方法用于快速切换指定文章的可见性状态。
    /// （即将 IsHidden 从 true 改为 false，或从 false 改为 true）。
    /// </summary>
    /// <param name="id">要切换状态的文章的整数 ID。</param>
    /// <returns>如果文章存在并成功切换了状态，则返回 true；否则返回 false。</returns>
    public async Task<bool> TogglePostVisibilityAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post == null) return false;

        post.IsHidden = !post.IsHidden;
        await context.SaveChangesAsync();

        // 清除首页列表缓存 (包括普通用户和管理员的)
        InvalidatePostListCache();
        
        return true;
    }

    /// <summary>
    /// 切换点赞状态
    /// </summary>
    public async Task<(bool IsLiked, int NewLikeCount)> ToggleLikeAsync(int postId, int? userId, string? ipAddress)
    {
        var post = await context.Posts.FindAsync(postId);
        if (post == null)
        {
            throw new ArgumentException("Post not found");
        }

        // 查找是否已点赞
        PostLike? existingLike = null;
        if (userId.HasValue)
        {
            existingLike = await context.PostLikes.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);
        }
        else if (!string.IsNullOrEmpty(ipAddress))
        {
            existingLike = await context.PostLikes.FirstOrDefaultAsync(l => l.PostId == postId && l.IpAddress == ipAddress);
        }

        bool isLiked;
        if (existingLike != null)
        {
            // 取消点赞
            context.PostLikes.Remove(existingLike);
            post.LikeCount = Math.Max(0, post.LikeCount - 1);
            isLiked = false;
        }
        else
        {
            // 添加点赞
            var newLike = new PostLike
            {
                PostId = postId,
                UserId = userId,
                IpAddress = ipAddress
            };
            context.PostLikes.Add(newLike);
            post.LikeCount++;
            isLiked = true;
        }

        await context.SaveChangesAsync();
        
        // 也可以选择在这里清除缓存，或者让点赞数实时性要求不那么高
        // cache.Remove(AllPostsCacheKey); 

        return (isLiked, post.LikeCount);
    }

    // --- 回收站功能 (Trash) ---

    /// <summary>
    /// 获取回收站中的文章列表
    /// </summary>
    public async Task<(List<PostSummaryDto> Posts, int TotalCount)> GetDeletedPostsAsync(int page, int pageSize)
    {
        // 防御性检查：防止负数导致 Skip() 抛出异常
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        
        var query = context.Posts
            .AsNoTracking()
            .Where(p => p.IsDeleted);

        var total = await query.CountAsync();

        var data = await query
            .OrderByDescending(p => p.DeletedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PostSummaryDto(
                p.Id,
                p.Title,
                p.Content.Length > 150 ? p.Content.Substring(0, 150) + "..." : p.Content,
                p.Category != null ? p.Category.Name : "未分类",
                p.CategoryId,
                p.User != null ? (p.User.Nickname ?? p.User.Username) : "Unknown",
                p.User != null ? p.User.AvatarUrl : null,
                p.CreateTime,
                p.UpdatedAt,
                null, // CoverImage
                new List<string>(), // Tags
                p.IsHidden,
                p.LikeCount,
                null, // SeriesName
                0 // SeriesOrder
            ))
            .ToListAsync();

        return (data, total);
    }

    /// <summary>
    /// 恢复回收站中的文章
    /// </summary>
    public async Task<bool> RestorePostAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post == null || !post.IsDeleted) return false;

        logger.LogInformation("Restoring post from trash: PostId={PostId}, Title={Title}", id, post.Title);
        
        post.IsDeleted = false;
        post.DeletedAt = null;
        await context.SaveChangesAsync();

        // 清除缓存
        InvalidatePostListCache();

        logger.LogInformation("Post restored successfully: PostId={PostId}", id);
        return true;
    }

    /// <summary>
    /// 永久删除文章（物理删除 + 清理云端图片）
    /// </summary>
    public async Task PermanentDeletePostAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post != null)
        {
            logger.LogWarning(
                "Permanently deleting post: PostId={PostId}, Title={Title}",
                id, post.Title
            );
            
            // 清理云端图片资源
            await imageService.DeleteImagesForPostAsync(id);

            // 物理删除
            context.Posts.Remove(post);
            await context.SaveChangesAsync();

            // 清除缓存
            InvalidatePostListCache();
            
            logger.LogWarning("Post permanently deleted: PostId={PostId}", id);
        }
    }

    // --- 相关文章推荐 ---

    /// <summary>
    /// 获取与指定文章相关的推荐文章
    /// 算法：优先同系列 > 同分类 > 同标签
    /// </summary>
    public async Task<List<PostSummaryDto>> GetRelatedPostsAsync(int postId, int count = 4)
    {
        // 1. 获取当前文章信息
        var currentPost = await context.Posts
            .AsNoTracking()
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted);

        if (currentPost == null) return new List<PostSummaryDto>();

        var relatedIds = new HashSet<int>();
        var result = new List<PostSummaryDto>();

        // 2. 优先级 1: 同系列的文章
        if (currentPost.SeriesId.HasValue)
        {
            var seriesPosts = await context.Posts
                .AsNoTracking()
                .Where(p => p.SeriesId == currentPost.SeriesId 
                         && p.Id != postId 
                         && !p.IsDeleted 
                         && !p.IsHidden)
                .OrderBy(p => p.SeriesOrder)
                .Take(count)
                .Select(p => new PostSummaryDto(
                    p.Id, p.Title,
                    p.Content.Length > 100 ? p.Content.Substring(0, 100) + "..." : p.Content,
                    p.Category != null ? p.Category.Name : "未分类",
                    p.CategoryId,
                    p.User != null ? (p.User.Nickname ?? p.User.Username) : "Unknown",
                    p.User != null ? p.User.AvatarUrl : null,
                    p.CreateTime, p.UpdatedAt, null,
                    new List<string>(), p.IsHidden, p.LikeCount, null, 0
                ))
                .ToListAsync();

            foreach (var post in seriesPosts)
            {
                if (relatedIds.Add(post.Id)) result.Add(post);
            }
        }

        // 3. 优先级 2: 同分类的文章
        if (result.Count < count && currentPost.CategoryId.HasValue)
        {
            var categoryPosts = await context.Posts
                .AsNoTracking()
                .Where(p => p.CategoryId == currentPost.CategoryId 
                         && p.Id != postId 
                         && !p.IsDeleted 
                         && !p.IsHidden)
                .OrderByDescending(p => p.CreateTime)
                .Take(count)
                .Select(p => new PostSummaryDto(
                    p.Id, p.Title,
                    p.Content.Length > 100 ? p.Content.Substring(0, 100) + "..." : p.Content,
                    p.Category != null ? p.Category.Name : "未分类",
                    p.CategoryId,
                    p.User != null ? (p.User.Nickname ?? p.User.Username) : "Unknown",
                    p.User != null ? p.User.AvatarUrl : null,
                    p.CreateTime, p.UpdatedAt, null,
                    new List<string>(), p.IsHidden, p.LikeCount, null, 0
                ))
                .ToListAsync();

            foreach (var post in categoryPosts)
            {
                if (result.Count >= count) break;
                if (relatedIds.Add(post.Id)) result.Add(post);
            }
        }

        // 4. 优先级 3: 同标签的文章
        if (result.Count < count)
        {
            var tagIds = currentPost.Tags.Select(t => t.Id).ToList();
            if (tagIds.Any())
            {
                var tagPosts = await context.Posts
                    .AsNoTracking()
                    .Where(p => p.Tags.Any(t => tagIds.Contains(t.Id))
                             && p.Id != postId 
                             && !p.IsDeleted 
                             && !p.IsHidden)
                    .OrderByDescending(p => p.CreateTime)
                    .Take(count)
                    .Select(p => new PostSummaryDto(
                        p.Id, p.Title,
                        p.Content.Length > 100 ? p.Content.Substring(0, 100) + "..." : p.Content,
                        p.Category != null ? p.Category.Name : "未分类",
                        p.CategoryId,
                        p.User != null ? (p.User.Nickname ?? p.User.Username) : "Unknown",
                        p.User != null ? p.User.AvatarUrl : null,
                        p.CreateTime, p.UpdatedAt, null,
                        new List<string>(), p.IsHidden, p.LikeCount, null, 0
                    ))
                    .ToListAsync();

                foreach (var post in tagPosts)
                {
                    if (result.Count >= count) break;
                    if (relatedIds.Add(post.Id)) result.Add(post);
                }
            }
        }

        return result.Take(count).ToList();
    }

    // --- 点赞状态查询 ---

    /// <summary>
    /// 查询当前用户是否已点赞指定文章
    /// </summary>
    public async Task<bool> IsLikedAsync(int postId, int? userId, string? ipAddress)
    {
        if (userId.HasValue)
        {
            return await context.PostLikes
                .AsNoTracking()
                .AnyAsync(l => l.PostId == postId && l.UserId == userId);
        }
        else if (!string.IsNullOrEmpty(ipAddress))
        {
            return await context.PostLikes
                .AsNoTracking()
                .AnyAsync(l => l.PostId == postId && l.IpAddress == ipAddress);
        }
        
        return false;
    }

    /// <summary>
    /// 批量查询多篇文章的点赞状态 (用于文章列表页)
    /// </summary>
    public async Task<Dictionary<int, bool>> GetLikeStatusBatchAsync(IEnumerable<int> postIds, int? userId, string? ipAddress)
    {
        var idList = postIds.ToList();
        if (!idList.Any()) return new Dictionary<int, bool>();

        HashSet<int> likedPostIds;
        
        if (userId.HasValue)
        {
            likedPostIds = (await context.PostLikes
                .AsNoTracking()
                .Where(l => idList.Contains(l.PostId) && l.UserId == userId)
                .Select(l => l.PostId)
                .ToListAsync())
                .ToHashSet();
        }
        else if (!string.IsNullOrEmpty(ipAddress))
        {
            likedPostIds = (await context.PostLikes
                .AsNoTracking()
                .Where(l => idList.Contains(l.PostId) && l.IpAddress == ipAddress)
                .Select(l => l.PostId)
                .ToListAsync())
                .ToHashSet();
        }
        else
        {
            likedPostIds = new HashSet<int>();
        }

        return idList.ToDictionary(id => id, id => likedPostIds.Contains(id));
    }

    /// <summary>
    /// 获取用户点赞过的文章列表
    /// </summary>
    public async Task<(List<PostSummaryDto> Posts, int TotalCount)> GetLikedPostsAsync(int userId, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        // 获取用户点赞的文章 ID 列表
        var likedPostIds = await context.PostLikes
            .AsNoTracking()
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreateTime)
            .Select(l => l.PostId)
            .ToListAsync();

        var totalCount = likedPostIds.Count;

        // 分页获取文章 ID
        var pagedPostIds = likedPostIds
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        if (!pagedPostIds.Any())
        {
            return (new List<PostSummaryDto>(), totalCount);
        }

        // 获取文章详情
        var posts = await context.Posts
            .AsNoTracking()
            .Where(p => pagedPostIds.Contains(p.Id) && !p.IsDeleted && !p.IsHidden)
            .Select(p => new PostSummaryDto(
                p.Id,
                p.Title,
                p.Content.Length > 150 ? p.Content.Substring(0, 150) + "..." : p.Content,
                p.Category != null ? p.Category.Name : "未分类",
                p.CategoryId,
                p.User != null ? (p.User.Nickname ?? p.User.Username) : "Unknown",
                p.User != null ? p.User.AvatarUrl : null,
                p.CreateTime,
                p.UpdatedAt,
                null,
                new List<string>(),
                p.IsHidden,
                p.LikeCount,
                p.Series != null ? p.Series.Name : null,
                0
            ))
            .ToListAsync();

        // 按点赞时间顺序排序返回
        // 使用 OfType<T>() 同时过滤 null 并转换类型，避免 CS8619 警告
        var orderedPosts = pagedPostIds
            .Select(id => posts.FirstOrDefault(p => p.Id == id))
            .OfType<PostSummaryDto>()
            .ToList();

        return (orderedPosts, totalCount);
    }
}