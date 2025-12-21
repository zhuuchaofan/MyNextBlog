using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;

namespace MyNextBlog.Services.Email;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var smtpSettings = _configuration.GetSection("SmtpSettings");
            var host = smtpSettings["Host"];
            var port = int.Parse(smtpSettings["Port"] ?? "587");
            var senderEmail = smtpSettings["SenderEmail"];
            var senderPassword = smtpSettings["SenderPassword"]; // App Password
            var enableSsl = bool.Parse(smtpSettings["EnableSsl"] ?? "true");

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = enableSsl
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail!, "MyNextBlog"),
                Subject = subject,
                Body = body,
                IsBodyHtml = true,
            };
            mailMessage.To.Add(to);

            var pipeline = new ResiliencePipelineBuilder()
                .AddRetry(new RetryStrategyOptions
                {
                    MaxRetryAttempts = 3,
                    BackoffType = DelayBackoffType.Exponential,
                    Delay = TimeSpan.FromSeconds(2),
                    OnRetry = args =>
                    {
                        _logger.LogWarning($"[Email Retry] Attempt {args.AttemptNumber} failed: {args.Outcome.Exception?.Message}. Waiting {args.RetryDelay}...");
                        return default;
                    }
                })
                .Build();

            await pipeline.ExecuteAsync(async ct => await client.SendMailAsync(mailMessage, ct));
            _logger.LogInformation($"Email sent successfully to {to}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to send email to {to}");
            // 我们不希望邮件发送失败导致评论发表失败，所以只记录日志，不抛出异常
        }
    }
}
