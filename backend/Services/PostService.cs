using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public class PostService(AppDbContext context, IImageService imageService) : IPostService
{
    // 数据库上下文

    // 构造函数注入数据库上下文
    // 获取所有文章
    public async Task<List<Post>> GetAllPostsAsync(bool includeHidden = false, int? categoryId = null, string? searchTerm = null, string? tagName = null)
    {
        // 对应之前的 Index 逻辑
        var query = context.Posts.AsQueryable();

        if (!includeHidden)
        {
            query = query.Where(p => !p.IsHidden);
        }
        
        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(p => p.Title.Contains(searchTerm) || p.Content.Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(tagName))
        {
            query = query.Where(p => p.Tags.Any(t => t.Name == tagName));
        }

        return await query
                .Include(p => p.Category) // <--- 把分类也查出来，否则页面显示为空
                .Include(p => p.User)     // <--- 把作者也查出来
                .Include(p => p.Tags)     // <--- 把标签也查出来
                .Include(m => m.Comments)
                .OrderByDescending(p => p.CreateTime)
                .ToListAsync();
    }
    // 根据 ID 获取文章
    public async Task<Post?> GetPostByIdAsync(int id)
    {
        // 对应之前的 Details/Edit/Delete 查找逻辑
        return await context.Posts
            //.Include(m => m.Comments) // <--- 移除：不再一次性加载所有评论，改为分页加载
            .Include(p => p.Category) // <--- 把分类也查出来，否则页面显示为空
            .Include(p => p.User)     // <--- 把作者也查出来
            .Include(p => p.Tags)     // <--- 把标签也查出来
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    // 分页获取评论
    public async Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize)
    {
        return await context.Comments
            .Include(c => c.User) // 加载关联用户
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.CreateTime) // 改为倒序，最新的在上面 (符合前端插入逻辑)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    // 获取评论总数
    public async Task<int> GetCommentCountAsync(int postId)
    {
        return await context.Comments.CountAsync(c => c.PostId == postId);
    }

    // 添加文章
    public async Task AddPostAsync(Post post)
    {
        context.Add(post);
        await context.SaveChangesAsync();
        
        // 关联图片
        await imageService.AssociateImagesAsync(post.Id, post.Content);
    }
    // 更新文章
    public async Task UpdatePostAsync(Post post)
    {
        context.Update(post);
        await context.SaveChangesAsync();

        // 重新关联图片 (防止文章内容修改后，引入了新的无主图片)
        await imageService.AssociateImagesAsync(post.Id, post.Content);
    }
    // 删除文章
    public async Task DeletePostAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post != null)
        {
            // 1. 先删除关联的图片 (云端文件 + 数据库记录)
            await imageService.DeleteImagesForPostAsync(id);

            // 2. 再删除文章本身
            context.Posts.Remove(post);
            await context.SaveChangesAsync();
        }
    }
    // 添加评论
    public async Task AddCommentAsync(Comment comment)
    {
        context.Comments.Add(comment);
        await context.SaveChangesAsync();
    }
    // 获取所有分类
    public async Task<List<Category>> GetCategoriesAsync()
    {
        return await context.Categories.ToListAsync();
    }

    // 切换文章可见性
    public async Task<bool> TogglePostVisibilityAsync(int id)
    {
        var post = await context.Posts.FindAsync(id);
        if (post == null) return false;

        post.IsHidden = !post.IsHidden;
        await context.SaveChangesAsync();
        return true;
    }
}