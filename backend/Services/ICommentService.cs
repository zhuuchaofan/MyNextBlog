// ============================================================================
// Services/ICommentService.cs - 评论服务接口
// ============================================================================
// 此接口定义了评论模块的业务契约。
//
// **架构修复 (2026-01-01)**: 返回 DTO 而非 Entity，防止数据泄露

using MyNextBlog.DTOs;    // 数据传输对象
using MyNextBlog.Models;  // 仅用于内部返回（CreateCommentAsync）

namespace MyNextBlog.Services;

/// <summary>
/// 评论服务接口
/// </summary>
public interface ICommentService
{
    /// <summary>
    /// 获取文章评论（公开接口，返回 DTO）
    /// </summary>
    Task<List<CommentDto>> GetCommentsAsync(int postId, int page, int pageSize);
    
    /// <summary>
    /// 获取评论总数
    /// </summary>
    Task<int> GetCommentCountAsync(int postId);
    
    // Admin methods
    /// <summary>
    /// 管理员获取所有评论（返回 AdminCommentDto）
    /// </summary>
    Task<(List<AdminCommentDto> Comments, int TotalCount)> GetAllCommentsForAdminAsync(int page, int pageSize, bool? isApproved);
    
    Task<bool> ToggleApprovalAsync(int id);
    Task<bool> DeleteCommentAsync(int id);
    Task<int> BatchApproveAsync(List<int> ids);
    Task<int> BatchDeleteAsync(List<int> ids);

    // High-level business logic
    bool IsRateLimited(string ipAddress); // 频率限制检查
    Task<CommentCreationResult> CreateCommentAsync(int postId, string content, string? guestName, int? parentId, int? userId);
}

/// <summary>
/// 评论创建结果（内部使用，保留 Entity 用于后续处理）
/// </summary>
public record CommentCreationResult(bool Success, string Message, Comment? Comment);