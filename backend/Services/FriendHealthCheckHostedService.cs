// ============================================================================
// Services/FriendHealthCheckHostedService.cs - 友链健康检查后台服务
// ============================================================================
// 每 1 小时检测所有启用的友链是否在线。
// 使用 HEAD 请求 + Polly 重试策略。

using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using Polly;

namespace MyNextBlog.Services;

/// <summary>
/// 友链健康检查后台服务
/// 每 1 小时执行一次，使用 HEAD 请求检测友站在线状态
/// </summary>
public class FriendHealthCheckHostedService(
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpClientFactory,
    ILogger<FriendHealthCheckHostedService> logger) : BackgroundService
{
    // 检查间隔: 1 小时
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(1);
    
    // HTTP 请求超时: 10 秒
    private static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(10);
    
    // 启动延迟: 等待应用完全启动后再开始检查
    private static readonly TimeSpan StartupDelay = TimeSpan.FromMinutes(1);
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("友链健康检查服务已启动，检查间隔: {Interval}", CheckInterval);
        
        // 等待应用启动完成
        await Task.Delay(StartupDelay, stoppingToken);
        
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAllFriendsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // 正常取消，退出循环
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "友链健康检查执行异常");
            }
            
            // 等待下次检查
            await Task.Delay(CheckInterval, stoppingToken);
        }
        
        logger.LogInformation("友链健康检查服务已停止");
    }
    
    /// <summary>
    /// 检查所有启用的友链
    /// </summary>
    private async Task CheckAllFriendsAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("开始友链健康检查...");
        
        using var scope = scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        // 获取所有启用的友链
        var friends = await context.FriendLinks
            .Where(f => f.IsActive)
            .ToListAsync(stoppingToken);
        
        if (friends.Count == 0)
        {
            logger.LogDebug("没有启用的友链需要检查");
            return;
        }
        
        logger.LogInformation("开始检查 {Count} 个友链", friends.Count);
        
        var client = httpClientFactory.CreateClient("HealthCheck");
        client.Timeout = RequestTimeout;
        
        var onlineCount = 0;
        var offlineCount = 0;
        
        foreach (var friend in friends)
        {
            if (stoppingToken.IsCancellationRequested) break;
            
            var (isOnline, latencyMs) = await CheckHealthWithRetryAsync(client, friend.Url);
            
            friend.IsOnline = isOnline;
            friend.LatencyMs = latencyMs;
            friend.LastCheckTime = DateTime.UtcNow;
            
            if (isOnline)
            {
                onlineCount++;
                logger.LogDebug("友链 {Name} 在线, 延迟: {Latency}ms", friend.Name, latencyMs);
            }
            else
            {
                offlineCount++;
                logger.LogWarning("友链 {Name} 离线: {Url}", friend.Name, friend.Url);
            }
        }
        
        await context.SaveChangesAsync(stoppingToken);
        
        logger.LogInformation("友链健康检查完成: 在线 {Online}, 离线 {Offline}", onlineCount, offlineCount);
    }
    
    /// <summary>
    /// 使用 Polly 重试策略检查健康状态
    /// 失败后等待 10 秒重试 1 次
    /// </summary>
    private async Task<(bool IsOnline, int? LatencyMs)> CheckHealthWithRetryAsync(
        HttpClient client, string url)
    {
        // Polly 重试策略: 失败后等待 10 秒重试 1 次
        var retryPolicy = Policy
            .Handle<HttpRequestException>()
            .Or<TaskCanceledException>()
            .WaitAndRetryAsync(
                retryCount: 1,
                sleepDurationProvider: _ => TimeSpan.FromSeconds(10),
                onRetry: (ex, delay, retryCount, _) =>
                {
                    logger.LogDebug("友链检查重试 {RetryCount}: {Url}, 原因: {Message}", 
                        retryCount, url, ex.Message);
                });
        
        var sw = new Stopwatch();
        
        try
        {
            sw.Start();
            
            await retryPolicy.ExecuteAsync(async () =>
            {
                // 使用 HEAD 请求 (轻量)
                using var request = new HttpRequestMessage(HttpMethod.Head, url);
                request.Headers.UserAgent.ParseAdd("FriendCheck/1.0 (+https://zhuchaofan.com)");
                
                var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
                
                // 接受 2xx 和 3xx 状态码
                if (!response.IsSuccessStatusCode && (int)response.StatusCode >= 400)
                {
                    // 如果 HEAD 被禁用 (405)，尝试 GET
                    if (response.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed)
                    {
                        using var getRequest = new HttpRequestMessage(HttpMethod.Get, url);
                        getRequest.Headers.UserAgent.ParseAdd("FriendCheck/1.0 (+https://zhuchaofan.com)");
                        response = await client.SendAsync(getRequest, HttpCompletionOption.ResponseHeadersRead);
                    }
                    
                    response.EnsureSuccessStatusCode();
                }
            });
            
            sw.Stop();
            return (true, (int)sw.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            sw.Stop();
            logger.LogDebug("友链检查失败: {Url}, 原因: {Message}", url, ex.Message);
            return (false, null);
        }
    }
}
