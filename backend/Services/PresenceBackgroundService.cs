// ============================================================================
// Services/PresenceBackgroundService.cs - 用户状态后台轮询服务
// ============================================================================
// 此后台服务负责定时轮询第三方 API（Steam、WakaTime），
// 检测站长的在线活动并更新内存缓存。
//
// **轮询策略**:
//   - 活跃模式: 30 秒间隔（检测到活动时）
//   - 待机模式: 5 分钟间隔（连续离线时）

using System.Net.Http.Json;
using System.Text.Json;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

/// <summary>
/// 用户状态后台轮询服务
/// 
/// **数据流**: Third-Party APIs → CheckAllSourcesAsync → IMemoryCache ← Controller
/// </summary>
public class PresenceBackgroundService(
    IHttpClientFactory httpClientFactory,
    IServiceScopeFactory scopeFactory,
    ILogger<PresenceBackgroundService> logger) : BackgroundService
{
    // 轮询间隔配置
    private static readonly TimeSpan ActiveInterval = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan StandbyInterval = TimeSpan.FromMinutes(5);

    // 缓存键名
    private const string CacheKey = "user_presence";

    // SiteContents 键名
    private const string SteamKeyConfig = "config_steam_key";
    private const string SteamIdConfig = "config_steam_id";
    private const string WakaTimeKeyConfig = "config_wakatime_key";

    // 连续离线计数（用于切换到待机模式）
    private int _offlineCount = 0;
    private const int StandbyThreshold = 5; // 连续 5 次离线后切换

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("用户状态轮询服务已启动");

        // 启动时等待一小段时间，让其他服务初始化完成
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var status = await CheckAllSourcesAsync();
                
                // 通过 PresenceService 更新缓存（遵循单一职责原则）
                using (var scope = scopeFactory.CreateScope())
                {
                    var presenceService = scope.ServiceProvider.GetRequiredService<IPresenceService>();
                    presenceService.UpdateStatus(status);
                }

                // 决定下次轮询间隔
                TimeSpan delay;
                if (status.Status == "offline")
                {
                    _offlineCount++;
                    delay = _offlineCount >= StandbyThreshold ? StandbyInterval : ActiveInterval;

                    if (_offlineCount == StandbyThreshold)
                    {
                        logger.LogInformation("切换到待机模式，轮询间隔: {Interval}", StandbyInterval);
                    }
                }
                else
                {
                    // 检测到活动，重置计数器
                    if (_offlineCount >= StandbyThreshold)
                    {
                        logger.LogInformation("检测到活动，恢复活跃模式");
                    }
                    _offlineCount = 0;
                    delay = ActiveInterval;
                }

                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "状态检测异常，1 分钟后重试");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        logger.LogInformation("用户状态轮询服务已停止");
    }

    /// <summary>
    /// 检测所有数据源并返回最终状态
    /// 
    /// **优先级**: Manual Override > Coding > Gaming > Offline
    /// </summary>
    private async Task<UserPresenceDto> CheckAllSourcesAsync()
    {
        using var scope = scopeFactory.CreateScope();

        // 1. 检查手动覆盖（最高优先级）
        var presenceService = scope.ServiceProvider.GetRequiredService<IPresenceService>();
        var overrideStatus = await presenceService.GetOverrideAsync();
        if (overrideStatus != null)
        {
            logger.LogDebug("使用手动覆盖状态: {Status}", overrideStatus.Status);
            return overrideStatus;
        }

        // 2. 检查 WakaTime (Coding) - 优先级高于 Gaming
        var (isCoding, projectName) = await CheckWakaTimeAsync(scope);
        if (isCoding)
        {
            return new UserPresenceDto(
                Status: "coding",
                Icon: "Code",
                Message: string.IsNullOrEmpty(projectName) ? "正在编程" : $"正在编程 {projectName}",
                Details: null,
                Timestamp: DateTime.UtcNow
            );
        }

        // 3. 检查 Steam (Gaming)
        var gameName = await CheckSteamAsync(scope);
        if (!string.IsNullOrEmpty(gameName))
        {
            return new UserPresenceDto(
                Status: "gaming",
                Icon: "Gamepad2",
                Message: $"正在游玩 {gameName}",
                Details: null,
                Timestamp: DateTime.UtcNow
            );
        }

        // 4. 默认离线状态
        return new UserPresenceDto(
            Status: "offline",
            Icon: "Moon",
            Message: "当前离线",
            Details: null,
            Timestamp: DateTime.UtcNow
        );
    }

    /// <summary>
    /// 检查 Steam 游戏状态
    /// </summary>
    /// <returns>正在游玩的游戏名称，未游玩返回 null</returns>
    private async Task<string?> CheckSteamAsync(IServiceScope scope)
    {
        try
        {
            var siteContentService = scope.ServiceProvider.GetRequiredService<ISiteContentService>();

            // 获取 Steam API 配置
            var steamKey = await siteContentService.GetByKeyAsync(SteamKeyConfig);
            var steamId = await siteContentService.GetByKeyAsync(SteamIdConfig);

            if (steamKey?.Value == null || steamId?.Value == null)
            {
                logger.LogDebug("Steam 配置未设置，跳过检测");
                return null;
            }

            // 调用 Steam API
            var client = httpClientFactory.CreateClient();
            var url = $"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={steamKey.Value}&steamids={steamId.Value}";

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Steam API 请求失败: {StatusCode}", response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            // 解析响应: response.players[0].gameextrainfo
            if (doc.RootElement.TryGetProperty("response", out var responseProp) &&
                responseProp.TryGetProperty("players", out var playersProp) &&
                playersProp.GetArrayLength() > 0)
            {
                var player = playersProp[0];
                if (player.TryGetProperty("gameextrainfo", out var gameProp))
                {
                    var gameName = gameProp.GetString();
                    if (!string.IsNullOrEmpty(gameName))
                    {
                        logger.LogInformation("检测到 Steam 游戏: {Game}", gameName);
                        return gameName;
                    }
                }
            }

            return null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Steam 状态检测失败");
            return null;
        }
    }

    /// <summary>
    /// 检查 WakaTime 编程状态
    /// 
    /// **API**: https://wakatime.com/api/v1/users/current/status_bar/today
    /// **认证**: HTTP Basic Auth (API Key)
    /// </summary>
    /// <returns>元组：是否在编程，当前项目名称</returns>
    private async Task<(bool IsCoding, string? ProjectName)> CheckWakaTimeAsync(IServiceScope scope)
    {
        try
        {
            var siteContentService = scope.ServiceProvider.GetRequiredService<ISiteContentService>();

            // 获取 WakaTime API Key
            var wakaTimeKey = await siteContentService.GetByKeyAsync(WakaTimeKeyConfig);
            if (wakaTimeKey?.Value == null)
            {
                logger.LogDebug("WakaTime 配置未设置，跳过检测");
                return (false, null);
            }

            // 构建 HTTP Basic Auth Header
            // WakaTime 使用 "api_key:" 格式（注意冒号）
            var authBytes = System.Text.Encoding.UTF8.GetBytes($"{wakaTimeKey.Value}:");
            var authBase64 = Convert.ToBase64String(authBytes);

            // 调用 WakaTime Status Bar API
            var client = httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Basic {authBase64}");

            var url = "https://wakatime.com/api/v1/users/current/status_bar/today";
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("WakaTime API 请求失败: {StatusCode}", response.StatusCode);
                return (false, null);
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            // 解析响应
            if (!doc.RootElement.TryGetProperty("data", out var dataProp))
            {
                return (false, null);
            }

            // 检查是否有编程活动
            // cached_at 字段可以判断数据是否新鲜
            // grand_total.total_seconds > 0 表示今天有编程活动
            if (dataProp.TryGetProperty("grand_total", out var grandTotal) &&
                grandTotal.TryGetProperty("total_seconds", out var totalSeconds) &&
                totalSeconds.GetDouble() > 0)
            {
                // 检查最近是否活跃（通过 is_up_to_date 或 cached_at）
                bool isRecent = false;
                
                if (dataProp.TryGetProperty("is_up_to_date", out var isUpToDate))
                {
                    isRecent = isUpToDate.GetBoolean();
                }
                else if (dataProp.TryGetProperty("cached_at", out var cachedAt))
                {
                    // 如果 cached_at 在 15 分钟内，视为活跃
                    if (DateTime.TryParse(cachedAt.GetString(), out var cachedTime))
                    {
                        isRecent = (DateTime.UtcNow - cachedTime).TotalMinutes < 15;
                    }
                }

                if (isRecent)
                {
                    // 获取当前项目名称
                    string? projectName = null;
                    if (dataProp.TryGetProperty("projects", out var projects) &&
                        projects.GetArrayLength() > 0 &&
                        projects[0].TryGetProperty("name", out var nameProp))
                    {
                        projectName = nameProp.GetString();
                    }

                    logger.LogInformation("检测到 WakaTime 编程活动: {Project}", projectName ?? "未知项目");
                    return (true, projectName);
                }
            }

            return (false, null);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "WakaTime 状态检测失败");
            return (false, null);
        }
    }
}
