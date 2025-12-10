using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace MyNextBlog.Services;

/// <summary>
/// 数据库自动备份服务 (后台托管服务)
/// 继承自 BackgroundService，随应用程序启动而运行，负责定期备份 SQLite 数据库文件。
/// </summary>
public class DatabaseBackupService(IServiceProvider serviceProvider, ILogger<DatabaseBackupService> logger)
    : BackgroundService
{
    // 备份周期：每天一次
    private readonly TimeSpan _period = TimeSpan.FromHours(24);

    /// <summary>
    /// 服务主循环
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Database Backup Service is starting.");

        // 策略：不希望备份逻辑阻塞服务器启动，所以开一个独立的 Task 去跑首次备份。
        // 同时设置了 1 分钟的延迟，等待数据库初始化完成。
        _ = Task.Run(async () => 
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); 
            await DoBackupAsync();
        }, stoppingToken);

        // 使用 PeriodicTimer 定时器，比 Thread.Sleep 更高效且支持取消令牌
        using PeriodicTimer timer = new PeriodicTimer(_period);
        while (await timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested)
        {
            await DoBackupAsync();
        }
    }

    /// <summary>
    /// 执行单次备份操作
    /// </summary>
    private async Task DoBackupAsync()
    {
        try
        {
            logger.LogInformation("Starting scheduled database backup...");

            // 创建一个新的 Scope (作用域)，因为后台服务是单例的 (Singleton)，而 StorageService 通常是 Scoped 的。
            using (var scope = serviceProvider.CreateScope())
            {
                var storageService = scope.ServiceProvider.GetRequiredService<IStorageService>();
                
                // 定位数据库文件路径 (统一在 data/ 目录下)
                var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "data", "blog.db");

                if (!File.Exists(dbPath))
                {
                    logger.LogWarning($"Database file not found at {dbPath}, skipping backup.");
                    return;
                }

                // 关键步骤：复制到临时文件
                // 直接读取正在使用的 SQLite 文件可能会因为文件锁定而失败。
                // 虽然 SQLite 的 WAL 模式支持并发读取，但复制一份是最稳妥的做法。
                var tempPath = Path.GetTempFileName();
                File.Copy(dbPath, tempPath, true);

                try 
                {
                    // 生成带时间戳的文件名，方便回溯
                    var fileName = $"blog_backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.db";
                    using var stream = File.OpenRead(tempPath);
                    
                    // 上传到云存储的 "backups" 专用文件夹
                    var result = await storageService.UploadAsync(stream, fileName, "application/x-sqlite3", "backups");
                    logger.LogInformation($"Database backup uploaded successfully to: {result.Url}");
                }
                finally
                {
                    // 清理临时文件，防止磁盘塞满
                    if (File.Exists(tempPath)) File.Delete(tempPath);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during database backup.");
        }
    }
}