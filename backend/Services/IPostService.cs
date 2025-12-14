using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface IPostService
{
    // 定义这个服务能干什么
    // 支持数据库级分页，返回 (当前页数据, 总条数)
    Task<(List<Post> Posts, int TotalCount)> GetAllPostsAsync(int page, int pageSize, bool includeHidden = false, int? categoryId = null, string? searchTerm = null, string? tagName = null);
    Task<Post?> GetPostByIdAsync(int id, bool includeHidden = false);
    Task<Post?> GetPostForUpdateAsync(int id);
    Task AddPostAsync(Post post);
    Task UpdatePostAsync(Post post);
    Task DeletePostAsync(int id);
    Task AddCommentAsync(Comment comment);
    // 分页获取评论
    Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize);
    // 获取评论总数
    Task<int> GetCommentCountAsync(int postId);
    Task<List<Category>> GetCategoriesAsync(); // 获取所有分类
    
    // 切换文章可见性
    Task<bool> TogglePostVisibilityAsync(int id);

    // 切换点赞状态 (Toggle)
    // 返回值: (IsLiked: 当前是否已赞, NewLikeCount: 最新的点赞总数)
    Task<(bool IsLiked, int NewLikeCount)> ToggleLikeAsync(int postId, int? userId, string? ipAddress);
}