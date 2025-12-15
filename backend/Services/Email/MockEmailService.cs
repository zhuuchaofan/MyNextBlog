using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace MyNextBlog.Services.Email;

public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;

    public MockEmailService(ILogger<MockEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string to, string subject, string body)
    {
        _logger.LogInformation($"--- MOCK EMAIL SERVICE ---");
        _logger.LogInformation($"To: {to}");
        _logger.LogInformation($"Subject: {subject}");
        _logger.LogInformation($"Body: {body}");
        _logger.LogInformation($"--- END MOCK EMAIL ---");
        return Task.CompletedTask;
    }
}
