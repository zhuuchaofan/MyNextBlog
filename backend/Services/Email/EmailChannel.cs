// ============================================================================
// Services/Email/EmailChannel.cs - 邮件队列实现
// ============================================================================
// 基于 System.Threading.Channels 的邮件队列实现。
//
// **设计说明**:
//   - BoundedChannel: 容量上限 100，防止内存溢出
//   - FullMode.Wait: 队列满时阻塞生产者（而非丢弃）
//   - Singleton: 整个应用生命周期共享一个实例

using System.Threading.Channels;

namespace MyNextBlog.Services.Email;

/// <summary>
/// 邮件队列实现（基于 Channel&lt;T&gt;）
/// </summary>
public class EmailChannel : IEmailChannel
{
    private readonly Channel<EmailMessage> _channel;
    private readonly ILogger<EmailChannel> _logger;
    
    /// <summary>
    /// 队列容量上限
    /// </summary>
    private const int Capacity = 100;

    public EmailChannel(ILogger<EmailChannel> logger)
    {
        _logger = logger;
        
        // 创建有界队列，容量 100
        _channel = Channel.CreateBounded<EmailMessage>(new BoundedChannelOptions(Capacity)
        {
            // 队列满时等待（阻塞生产者），而非丢弃消息
            FullMode = BoundedChannelFullMode.Wait,
            // 单消费者模式（后台服务）
            SingleReader = true,
            // 多生产者模式（多个 Service 可能同时发邮件）
            SingleWriter = false
        });
    }

    /// <inheritdoc />
    public async ValueTask EnqueueAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        await _channel.Writer.WriteAsync(message, cancellationToken);
        _logger.LogDebug("邮件已入队: To={To}, Subject={Subject}", message.To, message.Subject);
    }

    /// <inheritdoc />
    public IAsyncEnumerable<EmailMessage> ReadAllAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
