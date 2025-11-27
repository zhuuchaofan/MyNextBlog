using Microsoft.EntityFrameworkCore;
using MyTechBlog.Data;
using MyTechBlog.Models;

namespace MyTechBlog.Services;

public class PostService : IPostService
{
    private readonly AppDbContext _context;

    public PostService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Post>> GetAllPostsAsync()
    {
        // 对应之前的 Index 逻辑
        return await _context.Posts.ToListAsync();
    }

    public async Task<Post?> GetPostByIdAsync(int id)
    {
        // 对应之前的 Details/Edit/Delete 查找逻辑
        return await _context.Posts
            .Include(m => m.Comments) // 记得带上评论
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task AddPostAsync(Post post)
    {
        _context.Add(post);
        await _context.SaveChangesAsync();
    }

    public async Task UpdatePostAsync(Post post)
    {
        _context.Update(post);
        await _context.SaveChangesAsync();
    }

    public async Task DeletePostAsync(int id)
    {
        var post = await _context.Posts.FindAsync(id);
        if (post != null)
        {
            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
        }
    }

    public async Task AddCommentAsync(Comment comment)
    {
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
    }
}