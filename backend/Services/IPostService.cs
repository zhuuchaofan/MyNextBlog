// ============================================================================
// Services/IPostService.cs - 文章服务接口
// ============================================================================
// 此接口定义了文章管理的核心业务契约。

// `using` 语句用于导入必要的命名空间
using MyNextBlog.Models;  // 领域模型
using MyNextBlog.DTOs;    // 数据传输对象

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `IPostService` 定义了文章模块的业务逻辑接口。
/// 
/// **职责**: 文章 CRUD, 分页查询, 推荐算法, 可见性管理
/// </summary>
public interface IPostService
{
    // 定义这个服务能干什么
    // 支持数据库级分页，返回 (当前页数据, 总条数)
    Task<(List<PostSummaryDto> Posts, int TotalCount)> GetAllPostsAsync(PostQueryDto query);
    Task<Post?> GetPostByIdAsync(int id, bool includeHidden = false);
    Task<Post?> GetPostForUpdateAsync(int id);
    Task<Post> AddPostAsync(CreatePostDto dto, int? userId);
    Task<Post> UpdatePostAsync(int id, UpdatePostDto dto);
    Task DeletePostAsync(int id);
    Task<PostSeriesDto?> GetSeriesInfoForPostAsync(int postId, int? seriesId, int currentOrder); // Added
    
    Task<List<CategoryDto>> GetCategoriesAsync(); // 获取所有分类
    
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

    // --- 点赞状态查询 ---
    // 查询当前用户是否已点赞指定文章
    Task<bool> IsLikedAsync(int postId, int? userId, string? ipAddress);
    
    // 批量查询多篇文章的点赞状态 (用于文章列表页)
    Task<Dictionary<int, bool>> GetLikeStatusBatchAsync(IEnumerable<int> postIds, int? userId, string? ipAddress);

    // 获取用户点赞过的文章列表 (需要登录)
    Task<(List<PostSummaryDto> Posts, int TotalCount)> GetLikedPostsAsync(int userId, int page, int pageSize);
}