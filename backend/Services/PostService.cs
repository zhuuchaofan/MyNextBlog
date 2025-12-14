// `using` 语句用于导入必要的命名空间，以便在当前文件中使用其中定义的类型。
using Microsoft.EntityFrameworkCore; // 引入 Entity Framework Core，用于数据库操作
using Microsoft.Extensions.Caching.Memory; // 引入内存缓存命名空间
using MyNextBlog.Data;              // 引入数据访问层命名空间，包含 AppDbContext
using MyNextBlog.Models;            // 引入应用程序的领域模型，如 Post, Comment, Category 等

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
public class PostService(AppDbContext context, IImageService imageService, IMemoryCache cache) : IPostService
{
    private const string AllPostsCacheKey = "all_posts_public"; // 首页文章列表的缓存 Key

    /// <summary>
    /// 获取文章列表 (数据库级分页)
    /// </summary>
    public async Task<(List<Post> Posts, int TotalCount)> GetAllPostsAsync(int page, int pageSize, bool includeHidden = false, int? categoryId = null, string? searchTerm = null, string? tagName = null)
    {
        // 构建基础查询
        var query = context.Posts.AsNoTracking().AsQueryable();

        // 1. 过滤文章可见性
        if (!includeHidden)
        {
            query = query.Where(p => !p.IsHidden);
        }
        
        // 2. 按分类筛选
        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        // 3. 关键词搜索
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(p => p.Title.Contains(searchTerm) || p.Content.Contains(searchTerm));
        }

        // 4. 按标签筛选
        if (!string.IsNullOrWhiteSpace(tagName))
        {
            query = query.Where(p => p.Tags.Any(t => t.Name == tagName));
        }

        // 5. 获取总记录数 (在分页之前)
        var totalCount = await query.CountAsync();

        // 6. 执行分页查询
        var posts = await query
                .OrderByDescending(p => p.CreateTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new Post
                {
                    Id = p.Id,
                    Title = p.Title,
                    // 摘要截取逻辑保持不变
                    Content = p.Content.Length > 200 ? p.Content.Substring(0, 200) : p.Content,
                    CreateTime = p.CreateTime,
                    IsHidden = p.IsHidden,
                    CategoryId = p.CategoryId,
                    Category = p.Category,
                    User = p.User,
                    Tags = p.Tags
                })
                .ToListAsync();

        return (posts, totalCount);
    }

    /// <summary>
    /// `GetPostByIdAsync` 方法用于根据文章的唯一 ID 获取单篇文章的详细信息。
    /// </summary>
    /// <param name="id">要查询的文章的整数 ID。</param>
    /// <param name="includeHidden">布尔值，如果为 `true`，则允许查询隐藏文章；否则，如果文章是隐藏的，将无法被查到。</param>
    /// <returns>返回一个 `Task<Post?>`。如果找到了符合条件的文章，则返回 `Post` 实体对象；否则返回 `null`。</returns>
    public async Task<Post?> GetPostByIdAsync(int id, bool includeHidden = false)
    {
        // 同样将 `Posts` DbSet 转换为 `IQueryable`，以便构建查询。
        // 使用 `.AsNoTracking()` 来优化只读查询的性能。
        var query = context.Posts.AsNoTracking().AsQueryable();

        // 根据 `includeHidden` 参数，决定是否在查询中添加过滤条件，只返回公开文章。
        if (!includeHidden)
        {
            query = query.Where(p => !p.IsHidden);
        }

        // `Include(...)`: 预加载文章的分类、作者和标签信息，避免后续访问时触发额外的数据库查询。
        // `FirstOrDefaultAsync(m => m.Id == id)`: 异步执行查询。
        //   - `FirstOrDefaultAsync`: 尝试获取满足条件的第一个元素。如果没有找到任何元素，则返回 `default(Post)` (即 `null`)。
        //   - `m => m.Id == id`: Lambda 表达式，作为筛选条件，查找 `Id` 属性与传入 `id` 相等的文章。
        return await query
            .Include(p => p.Category)
            .Include(p => p.User)
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(m => m.Id == id);
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
    /// <param name="post">要添加的 `Post` 实体对象。</param>
    /// <returns>一个 `Task`，表示异步操作的完成。</returns>
    /// <remarks>
    /// 在文章保存到数据库之后，此方法还会自动调用 `IImageService` 来分析文章内容中
    /// 引用的图片链接，并将这些图片与新创建的文章建立关联。这是为了实现图片生命周期的管理。
    /// </remarks>
    public async Task AddPostAsync(Post post)
    {
        // `context.Add(post)`: 告诉 EF Core，这个 `post` 实体是一个新的实体，需要被添加到数据库中。
        // 此时，EF Core 只是在内存中标记这个实体为“待添加”状态，还没有真正写入数据库。
        context.Add(post);
        // `await context.SaveChangesAsync()`: 异步地将所有在 `AppDbContext` 中标记为“待添加”、“待修改”或“待删除”的实体
        // 批量保存到数据库。EF Core 会生成相应的 SQL `INSERT` 语句并执行。
        // **重要**: 在 `SaveChangesAsync()` 执行后，`post` 对象的 `Id` 属性会被数据库自动生成的值填充。
        await context.SaveChangesAsync();
        
        // **自动关联图片资源**
        // 调用 `imageService` 的 `AssociateImagesAsync` 方法。
        // 作用：扫描刚刚保存的文章的 `Content` 字段，查找其中包含的图片 URL。
        // 如果找到，并且这些图片之前已经上传但还未关联到任何文章（即处于“游离”状态），
        // 那么 `AssociateImagesAsync` 会将这些图片与当前这篇 `post` 关联起来，
        // 更新它们的 `PostId` 字段。这对于后续清理未使用的图片（“僵尸图片”）非常重要。
        await imageService.AssociateImagesAsync(post.Id, post.Content);

        // 清除首页列表缓存，以便用户能立即看到新文章
        cache.Remove(AllPostsCacheKey);
    }

    /// <summary>
    /// `UpdatePostAsync` 方法用于更新数据库中已存在的文章记录。
    /// </summary>
    /// <param name="post">包含最新数据的 `Post` 实体对象。</param>
    /// <returns>一个 `Task`，表示异步操作的完成。</returns>
    /// <remarks>
    /// 在更新文章之后，此方法会重新扫描文章内容中的图片链接，
    /// 确保任何新增或修改的图片都能被正确关联。
    /// </remarks>
    public async Task UpdatePostAsync(Post post)
    {
        // `context.Update(post)`: 告诉 EF Core，这个 `post` 实体是一个已经被修改的实体，需要更新到数据库中。
        // EF Core 会跟踪 `post` 对象的状态变化，并生成相应的 SQL `UPDATE` 语句。
        context.Update(post);
        // `await context.SaveChangesAsync()`: 将内存中的更改同步到数据库。
        await context.SaveChangesAsync();

        // **更新后重新扫描并关联图片**
        // 即使是更新文章，也可能涉及图片内容的增删改。
        // 例如，用户可能在编辑文章时添加了新的图片。
        // 因此，这里再次调用 `imageService.AssociateImagesAsync`，以确保所有图片资源与最新文章内容保持同步。
        await imageService.AssociateImagesAsync(post.Id, post.Content);

        // 清除首页列表缓存，以反映修改
        cache.Remove(AllPostsCacheKey);
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

            // 清除首页列表缓存
            cache.Remove(AllPostsCacheKey);
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

        // 清除首页列表缓存，以便首页立即反映可见性变化
        cache.Remove(AllPostsCacheKey);
        
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

    