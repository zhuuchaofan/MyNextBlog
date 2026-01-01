// ============================================================================
// Services/ICommentNotificationService.cs - 评论通知服务接口
// ============================================================================
// 此接口定义了评论通知模块的业务契约。
//
// **设计目的**: 将邮件通知逻辑从 CommentService 中分离，遵循单一职责原则 (SRP)
// **解决问题**: 消除 CommentService 中的隐性依赖（通过 IServiceScopeFactory 手动解析服务）

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `ICommentNotificationService` 定义了评论通知模块的业务逻辑接口。
/// 
/// **职责**: 
///   - 发送新评论通知给站长
///   - 发送敏感词审核通知给站长
///   - 发送回复通知给被回复者
/// 
/// **使用方式**: 
///   在后台任务中调用 `SendNotificationsAsync`，Fire-and-Forget 模式
/// </summary>
public interface ICommentNotificationService
{
    /// <summary>
    /// 发送评论相关的所有通知
    /// </summary>
    /// <param name="commentId">评论 ID</param>
    /// <remarks>
    /// 此方法会根据评论状态和类型发送不同的通知：
    ///   - 敏感词评论 → 通知站长审核
    ///   - 正常评论 → 通知站长
    ///   - 回复评论 → 通知被回复者
    /// </remarks>
    Task SendNotificationsAsync(int commentId);
}
