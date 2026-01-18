// ============================================================================
// Services/Email/EmailMessage.cs - 邮件消息契约
// ============================================================================
// 用于在 Channel 队列中传递的邮件消息记录。
//
// **设计说明**:
//   - 使用 `record` 类型确保不可变性
//   - `CreatedAt` 用于监控队列延迟

namespace MyNextBlog.Services.Email;

/// <summary>
/// 邮件消息记录（用于队列传递）
/// </summary>
/// <param name="To">收件人邮箱</param>
/// <param name="Subject">邮件主题</param>
/// <param name="Body">邮件正文 (HTML)</param>
/// <param name="CreatedAt">消息创建时间（用于延迟监控）</param>
public record EmailMessage(
    string To,
    string Subject,
    string Body,
    DateTime CreatedAt
);
