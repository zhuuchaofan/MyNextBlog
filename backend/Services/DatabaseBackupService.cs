using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace MyNextBlog.Services;

public class DatabaseBackupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseBackupService> _logger;
    // 每天备份一次
    private readonly TimeSpan _period = TimeSpan.FromHours(24); 

    public DatabaseBackupService(IServiceProvider serviceProvider, ILogger<DatabaseBackupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Database Backup Service is starting.");

        // 立即在后台线程执行一次备份，确保服务有效
        // 使用 Task.Run 防止阻塞启动流程
        _ = Task.Run(async () => 
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); // 启动1分钟后备份
            await DoBackupAsync();
        }, stoppingToken);

        using PeriodicTimer timer = new PeriodicTimer(_period);
        while (await timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested)
        {
            await DoBackupAsync();
        }
    }

    private async Task DoBackupAsync()
    {
        try
        {
            _logger.LogInformation("Starting scheduled database backup...");

            using (var scope = _serviceProvider.CreateScope())
            {
                var storageService = scope.ServiceProvider.GetRequiredService<IStorageService>();
                
                // 假设数据库在 /app/data/blog.db (容器内路径)
                var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "data", "blog.db");

                if (!File.Exists(dbPath))
                {
                    _logger.LogWarning($"Database file not found at {dbPath}, skipping backup.");
                    return;
                }

                // 复制一份临时文件以避免锁定问题
                var tempPath = Path.GetTempFileName();
                File.Copy(dbPath, tempPath, true);

                try 
                {
                    var fileName = $"blog_backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.db";
                    using var stream = File.OpenRead(tempPath);
                    
                    // 指定存入 "backups" 文件夹
                    var result = await storageService.UploadAsync(stream, fileName, "application/x-sqlite3", "backups");
                    _logger.LogInformation($"Database backup uploaded successfully to: {result.Url}");
                }
                finally
                {
                    if (File.Exists(tempPath)) File.Delete(tempPath);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database backup.");
        }
    }
}
