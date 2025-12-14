using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface ICommentService
{
    Task AddCommentAsync(Comment comment);
    // 获取分页评论 (暂时保持原样，后续可以改为支持树状结构)
    Task<List<Comment>> GetCommentsAsync(int postId, int page, int pageSize);
    Task<int> GetCommentCountAsync(int postId);
}