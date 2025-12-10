using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 文章核心业务服务
/// 负责处理文章的增删改查、评论管理以及分类/标签的关联查询
/// </summary>
public class PostService(AppDbContext context, IImageService imageService) : IPostService
{
    /// <summary>
    /// 获取文章列表（支持多种筛选条件）
    /// </summary>
    /// <param name="includeHidden">是否包含隐藏文章（管理员模式）</param>
    /// <param name="categoryId">按分类筛选（可选）</param>
    /// <param name="searchTerm">按标题或内容关键词搜索（可选）</param>
    /// <param name="tagName">按标签名称筛选（可选）</param>
    /// <returns>返回包含关联数据（分类、作者、标签）的文章列表</returns>
    public async Task<List<Post>> GetAllPostsAsync(bool includeHidden = false, int? categoryId = null, string? searchTerm = null, string? tagName = null)
    {
        var query = context.Posts.AsQueryable();

        // 1. 过滤可见性
        if (!includeHidden)
        {
            query = query.Where(p => !p.IsHidden);
        }
        
        // 2. 按分类筛选
        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        // 3. 关键词搜索 (标题或内容)
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(p => p.Title.Contains(searchTerm) || p.Content.Contains(searchTerm));
        }

        // 4. 按标签筛选
        // 注意：这里使用了 Any 查询，性能可能会受标签数量影响，但在博客规模下通常不是问题
        if (!string.IsNullOrWhiteSpace(tagName))
        {
            query = query.Where(p => p.Tags.Any(t => t.Name == tagName));
        }

        // 5. 执行查询并加载关联数据
        // 注意：不加载 Comments 以提升列表页性能
        return await query
                .Include(p => p.Category) // 加载分类信息
                .Include(p => p.User)     // 加载作者信息
                .Include(p => p.Tags)     // 加载标签信息
                .OrderByDescending(p => p.CreateTime) // 按时间倒序
                .ToListAsync();
    }

    /// <summary>
    /// 根据 ID 获取单篇文章详情
    /// </summary>
    /// <param name="id">文章 ID</param>
    /// <param name="includeHidden">是否允许查看隐藏文章</param>
    /// <returns>文章对象（若不存在或无权查看则返回 null）</returns>
    public async Task<Post?> GetPostByIdAsync(int id, bool includeHidden = false)
    {
        var query = context.Posts.AsQueryable();

        if (!includeHidden)
        {
            query = query.Where(p => !p.IsHidden);
        }

        return await query
            .Include(p => p.Category)
            .Include(p => p.User)
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    /// <summary>
    /// 分页获取文章的评论列表
    /// </summary>
    /// <param name="postId">文章 ID</param>
    /// <param name="page">页码 (从1开始)</param>
    /// <param name="pageSize">每页数量</param>
    /// <returns>评论列表</returns>
    public async Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize)
    {
        return await context.Comments
            .Include(c => c.User) // 加载评论者的用户信息的（如果是登录用户）
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.CreateTime) // 最新的评论在最前面
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    /// <summary>
    /// 获取某篇文章的评论总数
    /// </summary>
    public async Task<int> GetCommentCountAsync(int postId)
    {
        return await context.Comments.CountAsync(c => c.PostId == postId);
    }

    /// <summary>
    /// 创建新文章
    /// </summary>
    /// <remarks>
    /// 保存文章后，会自动分析内容中的图片链接，并将这些图片与文章建立关联。
    /// </remarks>
    public async Task AddPostAsync(Post post)
    {
        context.Add(post);
        await context.SaveChangesAsync();
        
        // 自动关联图片资源
        await imageService.AssociateImagesAsync(post.Id, post.Content);
    }

    /// <summary>
    /// 更新现有文章
    /// </summary>
    public async Task UpdatePostAsync(Post post)
    {
        context.Update(post);
        await context.SaveChangesAsync();

        // 更新后重新扫描并关联图片，防止引入了新图片却没记录
        await imageService.AssociateImagesAsync(post.Id, post.Content);
    }

    /// <summary>
    /// 删除文章
    /// </summary>
    /// <remarks>
    /// 执行级联删除逻辑：先删除关联的云端图片，再删除数据库记录。
    /// (评论和标签关系会通过数据库的外键级联自动处理)
    /// </remarks>
    public async Task DeletePostAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post != null)
        {
            // 1. 清理云端图片资源 (防止产生垃圾文件)
            await imageService.DeleteImagesForPostAsync(id);

            // 2. 删除文章实体
            context.Posts.Remove(post);
            await context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// 添加一条新评论
    /// </summary>
    public async Task AddCommentAsync(Comment comment)
    {
        context.Comments.Add(comment);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// 获取所有可用的文章分类
    /// </summary>
    public async Task<List<Category>> GetCategoriesAsync()
    {
        return await context.Categories.ToListAsync();
    }

    /// <summary>
    /// 快速切换文章的 可见/隐藏 状态
    /// </summary>
    /// <returns>操作是否成功</returns>
    public async Task<bool> TogglePostVisibilityAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post == null) return false;

        post.IsHidden = !post.IsHidden;
        await context.SaveChangesAsync();
        return true;
    }
}