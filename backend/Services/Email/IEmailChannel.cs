// ============================================================================
// Services/Email/IEmailChannel.cs - 邮件队列接口
// ============================================================================
// 定义邮件队列的生产者/消费者契约。
//
// **设计说明**:
//   - 抽象 Channel<T> 的读写操作
//   - 支持依赖注入和单元测试 Mock

namespace MyNextBlog.Services.Email;

/// <summary>
/// 邮件队列接口（生产者/消费者模式）
/// </summary>
public interface IEmailChannel
{
    /// <summary>
    /// 将邮件消息入队（生产者调用）
    /// </summary>
    /// <param name="message">邮件消息</param>
    /// <param name="cancellationToken">取消令牌</param>
    ValueTask EnqueueAsync(EmailMessage message, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// 读取所有排队中的邮件（消费者调用）
    /// </summary>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>异步邮件消息流</returns>
    IAsyncEnumerable<EmailMessage> ReadAllAsync(CancellationToken cancellationToken);
}
