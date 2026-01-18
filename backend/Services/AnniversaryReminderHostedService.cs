// Services/AnniversaryReminderHostedService.cs
// 纪念日提醒定时任务

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MyNextBlog.Services;

/// <summary>
/// 纪念日提醒后台定时任务
/// 每天 08:00 运行一次，检查并发送纪念日提醒
/// </summary>
public class AnniversaryReminderHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<AnniversaryReminderHostedService> logger) : BackgroundService
{
    // 执行间隔：每24小时
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);
    
    // 目标执行时间：UTC 00:00（北京时间 08:00）
    // 使用 UTC 时间确保 Docker 容器时区无关
    private static readonly TimeSpan TargetTimeUtc = new(0, 0, 0);
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("纪念日提醒服务已启动，目标执行时间: {Time} UTC", TargetTimeUtc);
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 计算到下一次执行的等待时间（统一使用 UTC）
                var now = DateTime.UtcNow;
                var nextRun = now.Date.Add(TargetTimeUtc);
                
                // 如果今天的目标时间已过，设为明天
                if (nextRun <= now)
                {
                    nextRun = nextRun.AddDays(1);
                }
                
                var delay = nextRun - now;
                logger.LogInformation("下次纪念日提醒检查时间: {NextRun} UTC (等待 {Delay})", nextRun, delay);
                
                await Task.Delay(delay, stoppingToken);
                
                // 执行提醒检查
                await CheckReminders();
            }
            catch (OperationCanceledException)
            {
                // 正常取消，退出循环
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "纪念日提醒服务执行异常");
                // 发生异常后等待 1 小时再重试
                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
        
        logger.LogInformation("纪念日提醒服务已停止");
    }
    
    /// <summary>
    /// 执行提醒检查
    /// </summary>
    private async Task CheckReminders()
    {
        logger.LogInformation("开始执行提醒检查...");
        
        // 创建独立的 DI 作用域（避免 DbContext 生命周期问题）
        using var scope = scopeFactory.CreateScope();
        
        // 1. 检查纪念日提醒
        var anniversaryReminderService = scope.ServiceProvider.GetRequiredService<IAnniversaryReminderService>();
        await anniversaryReminderService.CheckAndSendRemindersAsync();
        
        // 2. 检查计划提醒
        var planReminderService = scope.ServiceProvider.GetRequiredService<IPlanReminderService>();
        await planReminderService.CheckAndSendRemindersAsync();
        
        // 3. 检查待办任务提醒
        var todoReminderService = scope.ServiceProvider.GetRequiredService<ITodoReminderService>();
        await todoReminderService.CheckAndSendRemindersAsync();
        
        logger.LogInformation("提醒检查完成");
    }
}
