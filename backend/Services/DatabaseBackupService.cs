using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace MyNextBlog.Services;

/// <summary>
/// 数据库自动备份服务 (后台托管服务)
/// 负责在每天凌晨 (03:00 UTC) 生成数据库的安全快照并上传至云存储。
/// </summary>
public class DatabaseBackupService(IServiceProvider serviceProvider, ILogger<DatabaseBackupService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Database Backup Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            // 设定目标时间为今天的 03:00 UTC (通常是业务低峰期)
            var nextRun = now.Date.AddHours(3);
            
            // 如果今天已经过了 03:00，则定在明天的 03:00
            if (now >= nextRun)
            {
                nextRun = nextRun.AddDays(1);
            }

            var delay = nextRun - now;
            logger.LogInformation($"Next backup scheduled at {nextRun:u} UTC (in {delay.TotalHours:F2} hours).");

            try
            {
                // 等待直到预定时间
                await Task.Delay(delay, stoppingToken);

                // 执行备份
                await DoBackupAsync();
            }
            catch (OperationCanceledException)
            {
                // 服务停止
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred during the backup scheduling loop.");
                //如果发生异常，等待一小时后重试，避免死循环刷日志
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }

    private async Task DoBackupAsync()
    {
        // 临时文件路径 (使用 Guid 避免冲突)
        var tempPath = Path.Combine(Path.GetTempPath(), $"blog_snapshot_{Guid.NewGuid()}.db");

        try
        {
            logger.LogInformation("Starting scheduled database backup...");

            using (var scope = serviceProvider.CreateScope())
            {
                // 获取 DbContext 和 StorageService
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var storageService = scope.ServiceProvider.GetRequiredService<IStorageService>();

                // 1. 生成安全快照 (VACUUM INTO)
                // "VACUUM INTO" 是 SQLite 的原生命令，它可以在不阻塞写入的情况下，
                // 生成一个包含当前数据（包括 WAL 中未提交数据）的完整、一致的数据库副本。
                // 这比直接 File.Copy 安全得多，彻底避免了 "Database Locked" 或文件损坏问题。
                await context.Database.ExecuteSqlRawAsync($"VACUUM INTO '{tempPath}'");
                
                logger.LogInformation($"Database snapshot generated at: {tempPath}");

                // 2. 上传到云存储
                var fileName = $"blog_backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.db";
                using var stream = File.OpenRead(tempPath);
                
                var result = await storageService.UploadAsync(stream, fileName, "application/x-sqlite3", "backups");
                logger.LogInformation($"Database backup uploaded successfully to: {result.Url}");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Critical Error: Database backup failed.");
        }
        finally
        {
            // 3. 清理临时文件
            if (File.Exists(tempPath))
            {
                try
                {
                    File.Delete(tempPath);
                }
                catch (Exception deleteEx)
                {
                    logger.LogWarning(deleteEx, $"Failed to delete temp backup file: {tempPath}");
                }
            }
        }
    }
}