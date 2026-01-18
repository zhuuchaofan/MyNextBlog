// Services/TodoReminderHostedService.cs
// 待办任务提醒定时服务
// 与纪念日提醒不同：Todo 需要按用户指定的精确时间实时触发

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MyNextBlog.Services;

/// <summary>
/// 待办任务提醒后台定时服务
/// 每分钟检查一次，发现到期任务立即发送提醒邮件
/// </summary>
public class TodoReminderHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<TodoReminderHostedService> logger) : BackgroundService
{
    // 检查间隔：每1分钟
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(1);
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("待办任务提醒服务已启动，检查间隔: {Interval}", CheckInterval);
        
        // 启动后立即执行一次检查
        await CheckRemindersAsync();
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(CheckInterval, stoppingToken);
                await CheckRemindersAsync();
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "待办任务提醒服务执行异常");
                // 异常后等待 5 分钟再重试
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
        
        logger.LogInformation("待办任务提醒服务已停止");
    }
    
    /// <summary>
    /// 执行提醒检查
    /// </summary>
    private async Task CheckRemindersAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var todoReminderService = scope.ServiceProvider.GetRequiredService<ITodoReminderService>();
        await todoReminderService.CheckAndSendRemindersAsync();
    }
}
