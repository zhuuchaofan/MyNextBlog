using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using System.Diagnostics;

namespace MyNextBlog.Services;

/// <summary>
/// 数据库自动备份服务 (后台托管服务)
/// 负责在每天凌晨 (03:00 UTC) 使用 pg_dump 生成 PostgreSQL 数据库备份并上传至云存储。
/// </summary>
public class DatabaseBackupService(
    IServiceProvider serviceProvider, 
    ILogger<DatabaseBackupService> logger,
    IConfiguration configuration) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Database Backup Service (PostgreSQL) is starting.");

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
            logger.LogInformation("Next backup scheduled at {NextRun:u} UTC (in {Hours:F2} hours).", nextRun, delay.TotalHours);

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
                // 如果发生异常，等待一小时后重试，避免死循环刷日志
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }

    private async Task DoBackupAsync()
    {
        // 临时文件路径 (使用时间戳和 Guid 避免冲突)
        var fileName = $"blog_backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.sql";
        var tempPath = Path.Combine(Path.GetTempPath(), fileName);

        try
        {
            logger.LogInformation("Starting scheduled PostgreSQL database backup...");

            // 从连接字符串解析数据库连接信息
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            var connParams = ParseConnectionString(connectionString);

            // 使用 pg_dump 生成备份
            var success = await RunPgDumpAsync(connParams, tempPath);
            
            if (!success)
            {
                logger.LogError("pg_dump command failed. Backup aborted.");
                return;
            }

            logger.LogInformation("Database dump generated at: {TempPath}", tempPath);

            // 上传到云存储
            using var scope = serviceProvider.CreateScope();
            var storageService = scope.ServiceProvider.GetRequiredService<IStorageService>();
            
            await using var stream = File.OpenRead(tempPath);
            var result = await storageService.UploadAsync(stream, fileName, "application/sql", "backups");
            
            logger.LogInformation("Database backup uploaded successfully to: {Url}", result.Url);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Critical Error: Database backup failed.");
        }
        finally
        {
            // 清理临时文件
            if (File.Exists(tempPath))
            {
                try
                {
                    File.Delete(tempPath);
                }
                catch (Exception deleteEx)
                {
                    logger.LogWarning(deleteEx, "Failed to delete temp backup file: {TempPath}", tempPath);
                }
            }
        }
    }

    /// <summary>
    /// 执行 pg_dump 命令生成数据库备份
    /// </summary>
    private async Task<bool> RunPgDumpAsync(DbConnectionParams connParams, string outputPath)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "pg_dump",
                Arguments = $"-h {connParams.Host} -p {connParams.Port} -U {connParams.Username} -d {connParams.Database} -F p -f \"{outputPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                Environment =
                {
                    ["PGPASSWORD"] = connParams.Password // 通过环境变量传递密码，避免命令行暴露
                }
            };

            logger.LogInformation("Executing pg_dump for database: {Database}@{Host}:{Port}", 
                connParams.Database, connParams.Host, connParams.Port);

            using var process = Process.Start(startInfo);
            if (process == null)
            {
                logger.LogError("Failed to start pg_dump process.");
                return false;
            }

            var stderr = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                logger.LogError("pg_dump failed with exit code {ExitCode}. Error: {StdErr}", process.ExitCode, stderr);
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception while running pg_dump.");
            return false;
        }
    }

    /// <summary>
    /// 解析 PostgreSQL 连接字符串
    /// 格式: Host=xxx;Port=5432;Database=xxx;Username=xxx;Password=xxx
    /// </summary>
    private static DbConnectionParams ParseConnectionString(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("Database connection string is not configured.");
        }

        var parts = connectionString.Split(';')
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Select(p => p.Split('=', 2))
            .Where(p => p.Length == 2)
            .ToDictionary(p => p[0].Trim(), p => p[1].Trim(), StringComparer.OrdinalIgnoreCase);

        return new DbConnectionParams
        {
            Host = parts.GetValueOrDefault("Host", "localhost"),
            Port = parts.GetValueOrDefault("Port", "5432"),
            Database = parts.GetValueOrDefault("Database", "my_blog"),
            Username = parts.GetValueOrDefault("Username") ?? parts.GetValueOrDefault("User Id", "postgres"),
            Password = parts.GetValueOrDefault("Password", "")
        };
    }

    private class DbConnectionParams
    {
        public string Host { get; set; } = "localhost";
        public string Port { get; set; } = "5432";
        public string Database { get; set; } = "";
        public string Username { get; set; } = "";
        public string Password { get; set; } = "";
    }
}