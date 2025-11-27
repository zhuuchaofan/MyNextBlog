using Microsoft.EntityFrameworkCore;
using MyTechBlog.Data;
using MyTechBlog.Models;

namespace MyTechBlog.Services;

public class PostService : IPostService
{
    private readonly AppDbContext _context; // 数据库上下文
    // 构造函数注入数据库上下文
    public PostService(AppDbContext context)
    {
        _context = context;
    }
    // 获取所有文章
    public async Task<List<Post>> GetAllPostsAsync()
    {
        // 对应之前的 Index 逻辑
        return await _context.Posts
                .Include(p => p.Category) // <--- 把分类也查出来，否则页面显示为空
                .OrderByDescending(p => p.CreateTime)
                .ToListAsync();
    }
    // 根据 ID 获取文章
    public async Task<Post?> GetPostByIdAsync(int id)
    {
        // 对应之前的 Details/Edit/Delete 查找逻辑
        return await _context.Posts
            .Include(m => m.Comments) // <--- 把评论也查出来
            .Include(p => p.Category) // <--- 把分类也查出来，否则页面显示为空
            .FirstOrDefaultAsync(m => m.Id == id);
    }
    // 添加文章
    public async Task AddPostAsync(Post post)
    {
        _context.Add(post);
        await _context.SaveChangesAsync();
    }
    // 更新文章
    public async Task UpdatePostAsync(Post post)
    {
        _context.Update(post);
        await _context.SaveChangesAsync();
    }
    // 删除文章
    public async Task DeletePostAsync(int id)
    {
        var post = await _context.Posts.FindAsync(id);
        if (post != null)
        {
            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
        }
    }
    // 添加评论
    public async Task AddCommentAsync(Comment comment)
    {
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
    }
    // 获取所有分类
    public async Task<List<Category>> GetCategoriesAsync()
    {
        return await _context.Categories.ToListAsync();
    }
}