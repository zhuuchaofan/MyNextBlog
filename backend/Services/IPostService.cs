using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface IPostService
{
    // 定义这个服务能干什么
    Task<List<Post>> GetAllPostsAsync(bool includeHidden = false, int? categoryId = null, string? searchTerm = null, string? tagName = null);
    Task<Post?> GetPostByIdAsync(int id);
    Task AddPostAsync(Post post);
    Task UpdatePostAsync(Post post);
    Task DeletePostAsync(int id);
    Task AddCommentAsync(Comment comment);
    // 分页获取评论
    Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize);
    // 获取评论总数
    Task<int> GetCommentCountAsync(int postId);
    Task<List<Category>> GetCategoriesAsync(); // 获取所有分类
}