// ============================================================================
// Services/Email/BackgroundEmailService.cs - 后台邮件发送服务（消费者）
// ============================================================================
// 继承 BackgroundService，持续从队列读取并发送邮件。
//
// **设计说明**:
//   - 单例生命周期，随应用启动/停止
//   - 使用 Polly 进行重试（与原 SmtpEmailService 一致）
//   - 失败不影响其他邮件发送

using System.Net;
using System.Net.Mail;
using Polly;
using Polly.Retry;

namespace MyNextBlog.Services.Email;

/// <summary>
/// 后台邮件发送服务（消费者）
/// 从队列读取邮件并通过 SMTP 发送
/// </summary>
public class BackgroundEmailService : BackgroundService
{
    private readonly IEmailChannel _channel;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BackgroundEmailService> _logger;

    public BackgroundEmailService(
        IEmailChannel channel,
        IConfiguration configuration,
        ILogger<BackgroundEmailService> logger)
    {
        _channel = channel;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("后台邮件服务已启动，开始监听队列...");

        try
        {
            await foreach (var message in _channel.ReadAllAsync(stoppingToken))
            {
                await ProcessEmailAsync(message, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("后台邮件服务正在停止...");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "后台邮件服务发生未处理异常");
        }
    }

    /// <summary>
    /// 处理单封邮件（带重试）
    /// </summary>
    private async Task ProcessEmailAsync(EmailMessage message, CancellationToken stoppingToken)
    {
        var delay = DateTime.UtcNow - message.CreatedAt;
        _logger.LogDebug("开始发送邮件: To={To}, QueueDelay={Delay}ms", message.To, delay.TotalMilliseconds);

        try
        {
            var smtpSettings = _configuration.GetSection("SmtpSettings");
            var host = smtpSettings["Host"];
            var port = int.Parse(smtpSettings["Port"] ?? "587");
            var senderEmail = smtpSettings["SenderEmail"];
            var senderPassword = smtpSettings["SenderPassword"];
            var enableSsl = bool.Parse(smtpSettings["EnableSsl"] ?? "true");

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = enableSsl
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail!, "MyNextBlog"),
                Subject = message.Subject,
                Body = message.Body,
                IsBodyHtml = true,
            };
            mailMessage.To.Add(message.To);

            // Polly 重试策略：3次指数退避重试
            var pipeline = new ResiliencePipelineBuilder()
                .AddRetry(new RetryStrategyOptions
                {
                    MaxRetryAttempts = 3,
                    BackoffType = DelayBackoffType.Exponential,
                    Delay = TimeSpan.FromSeconds(2),
                    OnRetry = args =>
                    {
                        _logger.LogWarning(
                            "[Email Retry] Attempt {Attempt} failed: {Error}. Waiting {Delay}...",
                            args.AttemptNumber,
                            args.Outcome.Exception?.Message,
                            args.RetryDelay);
                        return default;
                    }
                })
                .Build();

            await pipeline.ExecuteAsync(async ct => await client.SendMailAsync(mailMessage, ct), stoppingToken);
            _logger.LogInformation("邮件发送成功: To={To}", message.To);
        }
        catch (Exception ex)
        {
            // 发送失败只记录日志，不影响其他邮件
            _logger.LogError(ex, "邮件发送失败: To={To}, Subject={Subject}", message.To, message.Subject);
        }
    }
}
