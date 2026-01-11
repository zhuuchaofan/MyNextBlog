// ============================================================================
// Services/FriendLinkService.cs - 友链服务实现
// ============================================================================
// 实现友链 CRUD 操作，包含 5 分钟内存缓存。

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 友链服务实现
/// </summary>
public class FriendLinkService(
    AppDbContext context,
    IMemoryCache cache,
    ILogger<FriendLinkService> logger) : IFriendLinkService
{
    // 缓存键
    private const string ActiveFriendsCacheKey = "friends:active";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
    
    /// <summary>
    /// 获取所有启用的友链 (带缓存)
    /// </summary>
    public async Task<List<FriendLinkDto>> GetAllActiveAsync()
    {
        // 尝试从缓存获取
        if (cache.TryGetValue(ActiveFriendsCacheKey, out List<FriendLinkDto>? cached) && cached != null)
        {
            return cached;
        }
        
        var friends = await context.FriendLinks
            .AsNoTracking()
            .Where(f => f.IsActive)
            .OrderBy(f => f.DisplayOrder)
            .ThenByDescending(f => f.CreatedAt)
            .Select(f => new FriendLinkDto(
                f.Id,
                f.Name,
                f.Url,
                f.Description,
                f.AvatarUrl,
                f.IsOnline,
                f.LatencyMs,
                f.LastCheckTime,
                f.DisplayOrder
            ))
            .ToListAsync();
        
        // 写入缓存
        cache.Set(ActiveFriendsCacheKey, friends, CacheDuration);
        
        logger.LogDebug("从数据库加载 {Count} 个友链", friends.Count);
        return friends;
    }
    
    /// <summary>
    /// 获取所有友链 (管理员)
    /// </summary>
    public async Task<List<FriendLinkAdminDto>> GetAllAsync()
    {
        return await context.FriendLinks
            .AsNoTracking()
            .OrderBy(f => f.DisplayOrder)
            .ThenByDescending(f => f.CreatedAt)
            .Select(f => new FriendLinkAdminDto(
                f.Id,
                f.Name,
                f.Url,
                f.Description,
                f.AvatarUrl,
                f.IsOnline,
                f.LatencyMs,
                f.LastCheckTime,
                f.DisplayOrder,
                f.IsActive,
                f.CreatedAt
            ))
            .ToListAsync();
    }
    
    /// <summary>
    /// 根据 ID 获取友链
    /// </summary>
    public async Task<FriendLinkAdminDto?> GetByIdAsync(int id)
    {
        var friend = await context.FriendLinks
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id);
        
        if (friend == null) return null;
        
        return new FriendLinkAdminDto(
            friend.Id,
            friend.Name,
            friend.Url,
            friend.Description,
            friend.AvatarUrl,
            friend.IsOnline,
            friend.LatencyMs,
            friend.LastCheckTime,
            friend.DisplayOrder,
            friend.IsActive,
            friend.CreatedAt
        );
    }
    
    /// <summary>
    /// 创建友链
    /// </summary>
    public async Task<FriendLinkAdminDto> CreateAsync(CreateFriendLinkDto dto)
    {
        // 自动递增 DisplayOrder：如果传入 <= 0，则自动设为最大值 + 1
        var displayOrder = dto.DisplayOrder;
        if (displayOrder <= 0)
        {
            var maxOrder = await context.FriendLinks
                .MaxAsync(f => (int?)f.DisplayOrder) ?? 0;
            displayOrder = maxOrder + 1;
        }
        
        var friend = new FriendLink
        {
            Name = dto.Name.Trim(),
            Url = dto.Url.Trim(),
            Description = dto.Description?.Trim(),
            AvatarUrl = dto.AvatarUrl?.Trim(),
            DisplayOrder = displayOrder,
            IsActive = true,
            IsOnline = true,  // 默认在线，等待健康检查更新
            CreatedAt = DateTime.UtcNow
        };
        
        context.FriendLinks.Add(friend);
        await context.SaveChangesAsync();
        
        // 清除缓存
        InvalidateCache();
        
        logger.LogInformation("创建友链: {Name} ({Url}), DisplayOrder: {Order}", friend.Name, friend.Url, displayOrder);
        
        return new FriendLinkAdminDto(
            friend.Id,
            friend.Name,
            friend.Url,
            friend.Description,
            friend.AvatarUrl,
            friend.IsOnline,
            friend.LatencyMs,
            friend.LastCheckTime,
            friend.DisplayOrder,
            friend.IsActive,
            friend.CreatedAt
        );
    }
    
    /// <summary>
    /// 更新友链
    /// </summary>
    public async Task<FriendLinkAdminDto?> UpdateAsync(int id, UpdateFriendLinkDto dto)
    {
        var friend = await context.FriendLinks.FindAsync(id);
        if (friend == null) return null;
        
        friend.Name = dto.Name.Trim();
        friend.Url = dto.Url.Trim();
        friend.Description = dto.Description?.Trim();
        friend.AvatarUrl = dto.AvatarUrl?.Trim();
        friend.DisplayOrder = dto.DisplayOrder;
        friend.IsActive = dto.IsActive;
        
        await context.SaveChangesAsync();
        
        // 清除缓存
        InvalidateCache();
        
        logger.LogInformation("更新友链: {Id} - {Name}", id, friend.Name);
        
        return new FriendLinkAdminDto(
            friend.Id,
            friend.Name,
            friend.Url,
            friend.Description,
            friend.AvatarUrl,
            friend.IsOnline,
            friend.LatencyMs,
            friend.LastCheckTime,
            friend.DisplayOrder,
            friend.IsActive,
            friend.CreatedAt
        );
    }
    
    /// <summary>
    /// 删除友链
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var friend = await context.FriendLinks.FindAsync(id);
        if (friend == null) return false;
        
        context.FriendLinks.Remove(friend);
        await context.SaveChangesAsync();
        
        // 清除缓存
        InvalidateCache();
        
        logger.LogInformation("删除友链: {Id} - {Name}", id, friend.Name);
        return true;
    }
    
    /// <summary>
    /// 更新健康状态 (由后台任务调用)
    /// </summary>
    public async Task UpdateHealthStatusAsync(int id, bool isOnline, int? latencyMs)
    {
        var friend = await context.FriendLinks.FindAsync(id);
        if (friend == null) return;
        
        friend.IsOnline = isOnline;
        friend.LatencyMs = latencyMs;
        friend.LastCheckTime = DateTime.UtcNow;
        
        await context.SaveChangesAsync();
        
        // 清除缓存（状态变化需要反映到前端）
        InvalidateCache();
    }
    
    /// <summary>
    /// 清除缓存
    /// </summary>
    private void InvalidateCache()
    {
        cache.Remove(ActiveFriendsCacheKey);
    }
}
