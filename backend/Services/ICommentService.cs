using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface ICommentService
{
    Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize);
    Task<int> GetCommentCountAsync(int postId);
    
    // Admin methods
    Task<(List<Comment> Comments, int TotalCount)> GetAllCommentsForAdminAsync(int page, int pageSize, bool? isApproved);
    Task<bool> ToggleApprovalAsync(int id);
    Task<bool> DeleteCommentAsync(int id);
    Task<int> BatchApproveAsync(List<int> ids);
    Task<int> BatchDeleteAsync(List<int> ids);

    // High-level business logic
    Task<CommentCreationResult> CreateCommentAsync(int postId, string content, string? guestName, int? parentId, int? userId);
}

public record CommentCreationResult(bool Success, string Message, Comment? Comment);