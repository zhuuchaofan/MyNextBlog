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
    /// `GetAllPostsAsync` 方法用于获取所有博客文章的列表，支持多种筛选条件和权限控制。
    /// </summary>
    /// <param name="includeHidden">布尔值，如果为 `true`，则包含 `IsHidden` 属性为 `true` 的文章（例如草稿）；否则只返回公开文章。</param>
    /// <param name="categoryId">可选的整数 ID，用于按文章所属的分类进行筛选。</param>
    /// <param name="searchTerm">可选的字符串，用于在文章标题或内容中进行关键词模糊搜索。</param>
    /// <param name="tagName">可选的字符串，用于按文章关联的标签名称进行筛选。</param>
    /// <returns>返回一个 `Task<List<Post>>`，其中包含符合条件且已加载关联数据（分类、作者、标签）的文章实体列表。</returns>
    public async Task<List<Post>> GetAllPostsAsync(bool includeHidden = false, int? categoryId = null, string? searchTerm = null, string? tagName = null)
    {
        // 缓存策略：仅缓存“默认首页列表”（即只查询公开文章，且无任何搜索或分类过滤条件）
        // 这是为了优化最高频的访问场景（首页加载），同时避免缓存组合爆炸。
        bool isCacheable = !includeHidden && categoryId == null && string.IsNullOrWhiteSpace(searchTerm) && string.IsNullOrWhiteSpace(tagName);

        // 尝试从缓存获取
        if (isCacheable && cache.TryGetValue(AllPostsCacheKey, out List<Post>? cachedPosts) && cachedPosts != null)
        {
            return cachedPosts;
        }

        // `context.Posts`: 通过 `AppDbContext` 访问数据库中的 `Posts` 表。
        // `.AsNoTracking()`: 禁用更改跟踪。对于只读查询，这可以显著提高性能，因为 EF Core 不需要维护实体状态的快照。
        // `.AsQueryable()`: 将 `DbSet<Post>` 转换为 `IQueryable<Post>`。
        // `IQueryable` 允许我们构建复杂的 LINQ 查询表达式，这些表达式在执行 `ToListAsync()` 等方法时，
        // 会被 EF Core 翻译成 SQL 语句，并在数据库层面执行，从而避免将整个表加载到内存中再筛选，提高效率。
        var query = context.Posts.AsNoTracking().AsQueryable();

        // 1. **过滤文章可见性**
        // 如果 `includeHidden` 为 `false`（即非管理员或未指定包含隐藏文章），则只选择 `IsHidden` 属性为 `false` 的文章。
        if (!includeHidden)
        {
            query = query.Where(p => !p.IsHidden);
        }
        
        // 2. **按分类筛选**
        // `categoryId.HasValue`: 检查 `categoryId` 是否有值（即不是 `null`）。
        // `p.CategoryId == categoryId.Value`: 筛选出 `CategoryId` 与传入值匹配的文章。
        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        // 3. **关键词搜索 (标题或内容)**
        // `!string.IsNullOrWhiteSpace(searchTerm)`: 检查 `searchTerm` 是否不为空或只包含空格。
        // `p.Title.Contains(searchTerm) || p.Content.Contains(searchTerm)`: 使用 `Contains` 方法进行模糊匹配。
        // EF Core 会将其转换为 SQL 的 `LIKE '%searchTerm%'` 语句。
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(p => p.Title.Contains(searchTerm) || p.Content.Contains(searchTerm));
        }

        // 4. **按标签筛选**
        // `p.Tags.Any(t => t.Name == tagName)`: 筛选出至少包含一个名称与 `tagName` 匹配的标签的文章。
        // `Any()` 是一个 LINQ 方法，用于检查集合中是否存在满足条件的元素。
        // 注意：这种 `Any` 查询在标签数量非常庞大时可能会有性能损耗，但在博客系统这种规模下通常是可接受的。
        if (!string.IsNullOrWhiteSpace(tagName))
        {
            query = query.Where(p => p.Tags.Any(t => t.Name == tagName));
        }

        // 5. **执行查询并加载关联数据 (使用 Select 投影优化)**
        // 优化：不再使用 Include 加载整篇文章，而是通过 Select 投影只选取必要的字段。
        // 特别是 Content 字段，只截取前 200 个字符用于生成摘要，这极大地减少了从数据库传输的数据量。
        var posts = await query
                .OrderByDescending(p => p.CreateTime) // 按 `CreateTime` 字段倒序排序
                .Select(p => new Post
                {
                    Id = p.Id,
                    Title = p.Title,
                    // 核心优化：如果内容超过 200 字，只截取前 200 字；否则取全部。
                    // 这对于列表页展示摘要已经足够，且避免了加载大段正文。
                    Content = p.Content.Length > 200 ? p.Content.Substring(0, 200) : p.Content,
                    CreateTime = p.CreateTime,
                    IsHidden = p.IsHidden,
                    CategoryId = p.CategoryId,
                    // 在 Select 投影中，Include 会失效，所以我们需要在这里手动映射关联属性。
                    // EF Core 会自动生成相应的 JOIN SQL 语句。
                    Category = p.Category,
                    User = p.User,
                    Tags = p.Tags
                })
                .ToListAsync();

        // 如果是可缓存的查询，则将结果写入缓存
        if (isCacheable)
        {
            var cacheEntryOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromMinutes(5)); // 设置 5 分钟绝对过期时间
            
            cache.Set(AllPostsCacheKey, posts, cacheEntryOptions);
        }

        return posts;
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
    /// `GetCommentsAsync` 方法用于获取指定文章的评论列表，支持分页功能。
    /// </summary>
    /// <param name="postId">要获取评论的文章的整数 ID。</param>
    /// <param name="page">当前页码，从 1 开始计数。</param>
    /// <param name="pageSize">每页包含的评论数量。</param>
    /// <returns>返回一个 `Task<List<Comment>>`，其中包含符合条件的评论实体列表。</returns>
    public async Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize)
    {
        return await context.Comments
            // `.AsNoTracking()`: 这是一个只读查询，不需要 EF Core 跟踪实体状态，加上此调用以优化性能。
            .AsNoTracking()
            // `Include(c => c.User)`: 预加载评论的作者信息。
            // 如果评论是由登录用户发布的，`c.User` 将包含该用户的详细信息。
            .Include(c => c.User) 
            // `Where(c => c.PostId == postId)`: 筛选出 `PostId` 与传入的 `postId` 相匹配的评论。
            .Where(c => c.PostId == postId)
            // `OrderByDescending(c => c.CreateTime)`: 按评论的 `CreateTime` 字段倒序排序，
            // 这样最新的评论会排在列表的最前面。
            .OrderByDescending(c => c.CreateTime)
            // `Skip((page - 1) * pageSize)`: 跳过前面页的记录。
            // 例如，第 1 页跳过 0 条，第 2 页跳过 `pageSize` 条。
            .Skip((page - 1) * pageSize)
            // `Take(pageSize)`: 获取当前页的记录数量。
            .Take(pageSize)
            // `ToListAsync()`: 异步执行查询，并将结果转换为 `List<Comment>`。
            .ToListAsync();
    }


    /// <summary>
    /// `GetCommentCountAsync` 方法用于获取指定文章的评论总数。
    /// </summary>
    /// <param name="postId">要统计评论的文章的整数 ID。</param>
    /// <returns>返回一个 `Task<int>`，表示该文章的评论总数。</returns>
    public async Task<int> GetCommentCountAsync(int postId)
    {
        // `context.Comments.CountAsync(c => c.PostId == postId)`:
        //   - `CountAsync()`: 这是一个 EF Core 异步方法，用于统计满足条件的记录数量。
        //   - `c => c.PostId == postId`: Lambda 表达式，筛选条件是 `PostId` 与传入的 `postId` 相等。
        // EF Core 会将此 LINQ 查询翻译成 SQL 的 `SELECT COUNT(*)` 语句，并在数据库层面执行，效率很高。
        return await context.Comments.CountAsync(c => c.PostId == postId);
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
    /// `AddCommentAsync` 方法用于向数据库中添加一条新的评论记录。
    /// </summary>
    /// <param name="comment">要添加的 `Comment` 实体对象。</param>
    /// <returns>一个 `Task`，表示异步操作的完成。</returns>
    public async Task AddCommentAsync(Comment comment)
    {
        // `context.Comments.Add(comment)`: 将新的 `comment` 实体添加到数据库的 `Comments` 表中。
        context.Comments.Add(comment);
        // `await context.SaveChangesAsync()`: 将内存中的添加操作同步到数据库。
        // 在此之后，`comment` 对象的 `Id` 属性会被数据库自动生成的值填充。
        await context.SaveChangesAsync();
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

                            // 清除首页列表缓存，以便首页立即反映可见性变化

                            cache.Remove(AllPostsCacheKey);

                

                            return true;

                        }

    }

    