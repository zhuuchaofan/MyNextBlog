// ============================================================================
// Services/Email/ChannelEmailService.cs - 队列邮件服务（生产者）
// ============================================================================
// 实现 IEmailService，将邮件消息入队而非直接发送。
//
// **工作流程**:
//   1. 调用方调用 SendEmailAsync()
//   2. 消息被推入 Channel 队列
//   3. 立即返回（非阻塞）
//   4. BackgroundEmailService 在后台消费并发送

namespace MyNextBlog.Services.Email;

/// <summary>
/// 队列邮件服务（生产者）
/// 将邮件消息入队，由后台服务异步发送
/// </summary>
public class ChannelEmailService : IEmailService
{
    private readonly IEmailChannel _channel;
    private readonly ILogger<ChannelEmailService> _logger;

    public ChannelEmailService(IEmailChannel channel, ILogger<ChannelEmailService> logger)
    {
        _channel = channel;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var message = new EmailMessage(to, subject, body, DateTime.UtcNow);
        
        try
        {
            await _channel.EnqueueAsync(message);
            _logger.LogInformation("邮件已入队（异步模式）: To={To}", to);
        }
        catch (Exception ex)
        {
            // 入队失败不应阻止业务流程
            _logger.LogError(ex, "邮件入队失败: To={To}, Subject={Subject}", to, subject);
        }
    }
}
