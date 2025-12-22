// `using` 语句用于导入必要的命名空间，以便在当前文件中使用其中定义的类型。
using Microsoft.EntityFrameworkCore; // 引入 Entity Framework Core，用于数据库操作
using Microsoft.Extensions.Caching.Memory; // 引入内存缓存命名空间
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
public class PostService(AppDbContext context, IImageService imageService, IMemoryCache cache, ITagService tagService) : IPostService
{
    private const string AllPostsCacheKey = "all_posts_public"; // 首页文章列表的缓存 Key

    /// <summary>
    /// 获取文章列表 (数据库级分页)
    /// </summary>
    /// <summary>
    /// 获取文章列表 (数据库级分页)
    /// </summary>
    public async Task<(List<PostSummaryDto> Posts, int TotalCount)> GetAllPostsAsync(int page, int pageSize, bool includeHidden = false, int? categoryId = null, string? searchTerm = null, string? tagName = null)
    {
        // 0. 判断是否为“纯净首页”请求 (只有这种情况才值得缓存)
        bool isCacheable = page == 1 && 
                           !categoryId.HasValue && 
                           string.IsNullOrWhiteSpace(searchTerm) && 
                           string.IsNullOrWhiteSpace(tagName);

        if (isCacheable)
        {
            // 为管理员和普通用户生成不同的 Key
            string cacheKey = $"{AllPostsCacheKey}_{includeHidden}";
            
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
            var query = context.Posts.AsNoTracking().AsQueryable();

            if (!includeHidden) query = query.Where(p => !p.IsHidden);
            if (categoryId.HasValue) query = query.Where(p => p.CategoryId == categoryId.Value);
            if (!string.IsNullOrWhiteSpace(searchTerm)) query = query.Where(p => p.Title.Contains(searchTerm) || p.Content.Contains(searchTerm));
            if (!string.IsNullOrWhiteSpace(tagName)) query = query.Where(p => p.Tags.Any(t => t.Name == tagName));

            var total = await query.CountAsync();
            
            // 1. 先查出数据 (Projection to Anonymous Type)
            // 这样既能避免 SELECT 全字段，又能享受 EF Core 的部分转换能力
            var data = await query
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
            .Where(p => p.SeriesId.HasValue && seriesIds.Contains(p.SeriesId.Value) && !p.IsHidden)
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
            .Where(p => p.SeriesId == seriesId && !p.IsHidden) // Assuming series posts should be public
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
        var post = new Post
        {
            Title = dto.Title,
            Content = dto.Content,
            CategoryId = dto.CategoryId,
            UserId = userId,
            SeriesId = dto.SeriesId,
            SeriesOrder = dto.SeriesOrder,
            CreateTime = DateTime.Now
        };

        if (dto.Tags != null && dto.Tags.Any())
        {
            post.Tags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
        }

        context.Add(post);
        await context.SaveChangesAsync();
        
        await imageService.AssociateImagesAsync(post.Id, post.Content);

        // 清除首页列表缓存 (包括普通用户和管理员的)
        cache.Remove($"{AllPostsCacheKey}_False");
        cache.Remove($"{AllPostsCacheKey}_True");

        return post;
    }

    public async Task<Post> UpdatePostAsync(int id, UpdatePostDto dto)
    {
        var post = await GetPostForUpdateAsync(id);
        if (post == null) throw new ArgumentException("文章不存在");

        post.Title = dto.Title;
        post.Content = dto.Content;
        post.CategoryId = dto.CategoryId;
        post.IsHidden = dto.IsHidden;
        post.SeriesId = dto.SeriesId;
        post.SeriesOrder = dto.SeriesOrder;

        post.Tags.Clear();
        if (dto.Tags != null && dto.Tags.Any())
        {
            var newTags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
            post.Tags.AddRange(newTags);
        }

        context.Update(post);
        await context.SaveChangesAsync();

        await imageService.AssociateImagesAsync(post.Id, post.Content);

        cache.Remove($"{AllPostsCacheKey}_False");
        cache.Remove($"{AllPostsCacheKey}_True");

        return post;
    }

    /// <summary>
    /// `DeletePostAsync` 方法用于从数据库中删除指定 ID 的文章。
    /// </summary>
    /// <param name="id">要删除的文章的整数 ID。</param>
    /// <returns>一个 `Task`，表示异步操作的完成。</returns>
    /// <remarks>
    /// 这是一个复杂的删除操作，因为它涉及到级联删除逻辑：
    ///   - **图片资源清理**: 首先会调用 `IImageService` 来清理与该文章关联的所有云端图片资源，
    ///     防止云存储中遗留“垃圾”文件。
    ///   - **数据库记录删除**: 然后从数据库中删除文章实体本身。
    ///   - **EF Core 级联**: 对于文章的评论和标签关系，由于在 `AppDbContext` 中配置了
    ///     数据库的外键级联删除规则，EF Core 会自动处理这些关联记录的删除。
    /// </remarks>
    public async Task DeletePostAsync(int id)
    {
        // `context.Posts.FindAsync(id)`: 异步地根据主键 ID 查找文章。
        // `FindAsync` 是一种高效的查找方式，它会先检查 EF Core 的 Change Tracker (内存缓存) 中是否有该实体，
        // 如果没有再查询数据库。
        var post = await context.Posts.FindAsync(id);
        if (post != null) // 确保文章存在才执行删除
        {
            // 1. **清理云端图片资源 (防止产生垃圾文件)**
            // 在删除数据库中的文章记录之前，先调用 `imageService` 来删除云存储中与此文章关联的所有图片。
            // 这样可以确保数据的一致性，防止只删除了数据库记录，而云端文件还在的情况。
            await imageService.DeleteImagesForPostAsync(id);

            // 2. **删除文章实体**
            // `context.Posts.Remove(post)`: 告诉 EF Core，这个 `post` 实体需要从数据库中删除。
            context.Posts.Remove(post);
            // `await context.SaveChangesAsync()`: 将删除操作同步到数据库。
            // 此时，根据 `AppDbContext` 中配置的级联删除规则，与此 `post` 关联的 `Comment` 实体
            // 和 `PostTag` (文章-标签关联表) 中的记录也会被自动删除。
            await context.SaveChangesAsync();

            // 清除首页列表缓存 (包括普通用户和管理员的)
            cache.Remove($"{AllPostsCacheKey}_False");
            cache.Remove($"{AllPostsCacheKey}_True");
        }
    }

    /// <summary>
    /// `GetCategoriesAsync` 方法用于获取数据库中所有可用的文章分类。
    /// </summary>
    /// <returns>返回一个 `Task<List<Category>>`，其中包含所有分类的实体列表。</returns>
    public async Task<List<Category>> GetCategoriesAsync()
    {
        // `context.Categories`: 访问数据库中的 `Categories` 表。
        // `.AsNoTracking()`: 这是一个只读查询，不需要 EF Core 跟踪实体状态，加上此调用以优化性能。
        // `ToListAsync()`: 异步执行查询，并将所有 `Category` 实体转换为 `List<Category>`。
        // 由于分类数据量通常不大，直接获取所有分类是常见的做法。
        return await context.Categories.AsNoTracking().ToListAsync();
    }

        /// <summary>

        /// `TogglePostVisibilityAsync` 方法用于快速切换指定文章的可见性状态。

        /// （即将 `IsHidden` 从 `true` 改为 `false`，或从 `false` 改为 `true`）。

        /// </summary>

        /// <param name="id">要切换状态的文章的整数 ID。</param>

        /// <returns>返回一个 `Task<bool>`。如果文章存在并成功切换了状态，则返回 `true`；否则返回 `false`。</returns>

            public async Task<bool> TogglePostVisibilityAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post == null) return false;

        post.IsHidden = !post.IsHidden;
        await context.SaveChangesAsync();

        // 清除首页列表缓存 (包括普通用户和管理员的)
        cache.Remove($"{AllPostsCacheKey}_False");
        cache.Remove($"{AllPostsCacheKey}_True");
        
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
}

    