// ============================================================================
// Services/PresenceService.cs - 用户在线状态服务实现
// ============================================================================
// 此服务负责管理用户在线状态的读写和手动覆盖逻辑。
//
// **架构说明**:
//   - 此服务注册为 Singleton，供 Controller 和 BackgroundService 共享
//   - 状态存储在 IMemoryCache 中，确保快速访问
//   - 手动覆盖存储在 SiteContents 表中（持久化）

using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

/// <summary>
/// 用户在线状态服务实现
/// 
/// **职责**:
///   - 读写内存缓存中的状态
///   - 管理手动覆盖（存储在 SiteContents）
/// </summary>
public class PresenceService(
    IMemoryCache memoryCache,
    IServiceScopeFactory scopeFactory,
    ILogger<PresenceService> logger) : IPresenceService
{
    // 缓存键名
    private const string CacheKey = "user_presence";
    private const string OverrideKey = "config_presence_override";

    // 默认离线状态
    private static readonly UserPresenceDto DefaultOfflineStatus = new(
        Status: "offline",
        Icon: "Moon",
        Message: "当前离线",
        Details: null,
        Timestamp: DateTime.UtcNow
    );

    /// <summary>
    /// 获取当前缓存的用户状态
    /// </summary>
    public UserPresenceDto GetCurrentStatus()
    {
        if (memoryCache.TryGetValue<UserPresenceDto>(CacheKey, out var status) && status != null)
        {
            return status;
        }

        // 缓存中没有状态，返回默认离线
        return DefaultOfflineStatus with { Timestamp = DateTime.UtcNow };
    }

    /// <summary>
    /// 更新缓存中的状态（供后台服务调用）
    /// </summary>
    public void UpdateStatus(UserPresenceDto status)
    {
        // 设置 5 分钟过期，防止后台服务停止后状态永不更新
        memoryCache.Set(CacheKey, status, TimeSpan.FromMinutes(5));
        logger.LogDebug("状态已更新: {Status} - {Message}", status.Status, status.Message);
    }

    /// <summary>
    /// 设置手动状态覆盖 (Admin)
    /// </summary>
    public async Task SetOverrideAsync(string status, string? message, DateTime? expireAt)
    {
        using var scope = scopeFactory.CreateScope();
        var siteContentService = scope.ServiceProvider.GetRequiredService<ISiteContentService>();

        var overrideData = new
        {
            status,
            message = message ?? "自定义状态",
            expireAt = expireAt?.ToString("O")  // ISO 8601 格式
        };

        var json = JsonSerializer.Serialize(overrideData);
        await siteContentService.UpsertAsync(OverrideKey, json, "用户状态手动覆盖配置");

        logger.LogInformation("已设置手动状态覆盖: {Status}", status);

        // 立即更新缓存
        var newStatus = new UserPresenceDto(
            Status: status,
            Icon: "Sparkles",
            Message: message ?? "自定义状态",
            Details: expireAt.HasValue ? $"至 {expireAt:yyyy-MM-dd HH:mm}" : null,
            Timestamp: DateTime.UtcNow
        );
        UpdateStatus(newStatus);
    }

    /// <summary>
    /// 清除手动覆盖
    /// </summary>
    public async Task ClearOverrideAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var siteContentService = scope.ServiceProvider.GetRequiredService<ISiteContentService>();

        // 将覆盖值设为空 JSON
        await siteContentService.UpsertAsync(OverrideKey, "{}", "用户状态手动覆盖配置（已清除）");

        logger.LogInformation("已清除手动状态覆盖");
    }

    /// <summary>
    /// 获取手动覆盖状态（如果存在且未过期）
    /// </summary>
    public async Task<UserPresenceDto?> GetOverrideAsync()
    {
        using var scope = scopeFactory.CreateScope();
        var siteContentService = scope.ServiceProvider.GetRequiredService<ISiteContentService>();

        var content = await siteContentService.GetByKeyAsync(OverrideKey);
        if (content == null || string.IsNullOrWhiteSpace(content.Value) || content.Value == "{}")
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(content.Value);
            var root = doc.RootElement;

            // 检查是否有 status 字段
            if (!root.TryGetProperty("status", out var statusProp))
            {
                return null;
            }

            var status = statusProp.GetString();
            if (string.IsNullOrEmpty(status))
            {
                return null;
            }

            // 检查是否过期
            if (root.TryGetProperty("expireAt", out var expireProp))
            {
                var expireStr = expireProp.GetString();
                if (!string.IsNullOrEmpty(expireStr) && DateTime.TryParse(expireStr, out var expireAt))
                {
                    if (DateTime.UtcNow > expireAt)
                    {
                        logger.LogInformation("手动覆盖已过期，自动清除");
                        await ClearOverrideAsync();
                        return null;
                    }
                }
            }

            var message = root.TryGetProperty("message", out var msgProp) 
                ? msgProp.GetString() ?? "自定义状态" 
                : "自定义状态";

            return new UserPresenceDto(
                Status: status,
                Icon: "Sparkles",
                Message: message,
                Details: null,
                Timestamp: DateTime.UtcNow
            );
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "解析手动覆盖配置失败");
            return null;
        }
    }
}
