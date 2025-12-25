using MyNextBlog.Models;
using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

public interface IPostService
{
    // 定义这个服务能干什么
    // 支持数据库级分页，返回 (当前页数据, 总条数)
    Task<(List<PostSummaryDto> Posts, int TotalCount)> GetAllPostsAsync(int page, int pageSize, bool includeHidden = false, int? categoryId = null, string? searchTerm = null, string? tagName = null);
    Task<Post?> GetPostByIdAsync(int id, bool includeHidden = false);
    Task<Post?> GetPostForUpdateAsync(int id);
    Task<Post> AddPostAsync(CreatePostDto dto, int? userId);
    Task<Post> UpdatePostAsync(int id, UpdatePostDto dto);
    Task DeletePostAsync(int id);
    Task<PostSeriesDto?> GetSeriesInfoForPostAsync(int postId, int? seriesId, int currentOrder); // Added
    
    Task<List<Category>> GetCategoriesAsync(); // 获取所有分类
    
    // 切换文章可见性
    Task<bool> TogglePostVisibilityAsync(int id);

    // 切换点赞状态 (Toggle)
    // 返回值: (IsLiked: 当前是否已赞, NewLikeCount: 最新的点赞总数)
    Task<(bool IsLiked, int NewLikeCount)> ToggleLikeAsync(int postId, int? userId, string? ipAddress);

    // --- 回收站功能 (Trash) ---
    Task<(List<PostSummaryDto> Posts, int TotalCount)> GetDeletedPostsAsync(int page, int pageSize);
    Task<bool> RestorePostAsync(int id);
    Task PermanentDeletePostAsync(int id);

    // --- 相关文章推荐 ---
    Task<List<PostSummaryDto>> GetRelatedPostsAsync(int postId, int count = 4);
}