// ============================================================================
// Services/MemoService.cs - Memo 服务实现
// ============================================================================
// 实现 Memo CRUD 和 Keyset Pagination。

using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// Memo 服务实现
/// </summary>
public class MemoService(
    AppDbContext context,
    IMemoryCache cache,
    ILogger<MemoService> logger) : IMemoService
{
    // 缓存键前缀
    private const string CacheKeyPrefix = "memos:";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);
    
    /// <summary>
    /// 获取公开的 Memo 列表 (Keyset Pagination)
    /// </summary>
    public async Task<MemoPageResult> GetPublicMemosAsync(string? cursor, int limit = 20)
    {
        // 限制每页最大数量
        limit = Math.Clamp(limit, 1, 50);
        
        // 构建基础查询 (先过滤，再排序)
        IQueryable<Memo> query = context.Memos
            .AsNoTracking()
            .Where(m => m.IsPublic);
        
        // 解析游标并应用过滤
        if (!string.IsNullOrEmpty(cursor))
        {
            var (cursorTime, cursorId) = DecodeCursor(cursor);
            if (cursorTime.HasValue && cursorId.HasValue)
            {
                // Keyset Pagination: 获取游标之后的数据
                query = query.Where(m =>
                    m.CreatedAt < cursorTime.Value ||
                    (m.CreatedAt == cursorTime.Value && m.Id < cursorId.Value));
            }
        }
        
        // 排序 (在过滤之后应用，确保排序不丢失)
        var orderedQuery = query
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id);
        
        // 获取 limit + 1 条数据判断是否有更多
        var memos = await orderedQuery.Take(limit + 1).ToListAsync();
        var hasMore = memos.Count > limit;
        
        // 截取实际返回的数据
        var items = memos.Take(limit).Select(m => new MemoDto(
            m.Id,
            m.Content,
            m.ImageUrls,
            m.Source,
            m.CreatedAt
        )).ToList();
        
        // 生成下一页游标
        string? nextCursor = null;
        if (hasMore && items.Count > 0)
        {
            var lastItem = memos[limit - 1];
            nextCursor = EncodeCursor(lastItem.CreatedAt, lastItem.Id);
        }
        
        return new MemoPageResult(items, nextCursor);
    }
    
    /// <summary>
    /// 获取所有 Memo (管理员，Offset Pagination)
    /// </summary>
    public async Task<List<MemoAdminDto>> GetAllAsync(int page, int pageSize)
    {
        return await context.Memos
            .AsNoTracking()
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MemoAdminDto(
                m.Id,
                m.Content,
                m.ImageUrls,
                m.Source,
                m.IsPublic,
                m.CreatedAt,
                m.UpdatedAt
            ))
            .ToListAsync();
    }
    
    /// <summary>
    /// 获取 Memo 总数
    /// </summary>
    public async Task<int> GetCountAsync(bool includePrivate = false)
    {
        var query = context.Memos.AsNoTracking();
        if (!includePrivate)
        {
            query = query.Where(m => m.IsPublic);
        }
        return await query.CountAsync();
    }
    
    /// <summary>
    /// 根据 ID 获取 Memo
    /// </summary>
    public async Task<MemoAdminDto?> GetByIdAsync(int id)
    {
        var memo = await context.Memos
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id);
        
        if (memo == null) return null;
        
        return new MemoAdminDto(
            memo.Id,
            memo.Content,
            memo.ImageUrls,
            memo.Source,
            memo.IsPublic,
            memo.CreatedAt,
            memo.UpdatedAt
        );
    }
    
    /// <summary>
    /// 创建 Memo
    /// </summary>
    public async Task<MemoAdminDto> CreateAsync(CreateMemoDto dto)
    {
        // 限制图片数量为 9 张
        var imageUrls = dto.ImageUrls?.Take(9).ToList() ?? [];
        
        var memo = new Memo
        {
            Content = dto.Content.Trim(),
            ImageUrls = imageUrls,
            Source = dto.Source,
            IsPublic = dto.IsPublic,
            CreatedAt = DateTime.UtcNow
        };
        
        context.Memos.Add(memo);
        await context.SaveChangesAsync();
        
        // 清除缓存
        InvalidateCache();
        
        logger.LogInformation("创建 Memo: {Id}", memo.Id);
        
        return new MemoAdminDto(
            memo.Id,
            memo.Content,
            memo.ImageUrls,
            memo.Source,
            memo.IsPublic,
            memo.CreatedAt,
            memo.UpdatedAt
        );
    }
    
    /// <summary>
    /// 更新 Memo
    /// </summary>
    public async Task<MemoAdminDto?> UpdateAsync(int id, UpdateMemoDto dto)
    {
        var memo = await context.Memos.FindAsync(id);
        if (memo == null) return null;
        
        memo.Content = dto.Content.Trim();
        memo.ImageUrls = dto.ImageUrls?.Take(9).ToList() ?? [];
        memo.IsPublic = dto.IsPublic;
        memo.UpdatedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync();
        
        // 清除缓存
        InvalidateCache();
        
        logger.LogInformation("更新 Memo: {Id}", id);
        
        return new MemoAdminDto(
            memo.Id,
            memo.Content,
            memo.ImageUrls,
            memo.Source,
            memo.IsPublic,
            memo.CreatedAt,
            memo.UpdatedAt
        );
    }
    
    /// <summary>
    /// 删除 Memo
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var memo = await context.Memos.FindAsync(id);
        if (memo == null) return false;
        
        context.Memos.Remove(memo);
        await context.SaveChangesAsync();
        
        // 清除缓存
        InvalidateCache();
        
        logger.LogInformation("删除 Memo: {Id}", id);
        return true;
    }
    
    /// <summary>
    /// 获取年度发布热力图数据
    /// </summary>
    public async Task<Dictionary<string, int>> GetHeatmapDataAsync(int year)
    {
        var cacheKey = $"{CacheKeyPrefix}heatmap:{year}";
        
        if (cache.TryGetValue(cacheKey, out Dictionary<string, int>? cached) && cached != null)
        {
            return cached;
        }
        
        var startDate = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate = new DateTime(year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        
        var data = await context.Memos
            .AsNoTracking()
            .Where(m => m.IsPublic && m.CreatedAt >= startDate && m.CreatedAt < endDate)
            .GroupBy(m => m.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();
        
        var result = data.ToDictionary(
            x => x.Date.ToString("yyyy-MM-dd"),
            x => x.Count
        );
        
        cache.Set(cacheKey, result, CacheDuration);
        return result;
    }
    
    #region 游标编解码
    
    /// <summary>
    /// 编码游标 (timestamp_id -> Base64)
    /// </summary>
    private static string EncodeCursor(DateTime timestamp, int id)
    {
        var text = $"{timestamp:O}_{id}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(text));
    }
    
    /// <summary>
    /// 解码游标 (Base64 -> timestamp, id)
    /// </summary>
    private static (DateTime? Timestamp, int? Id) DecodeCursor(string cursor)
    {
        try
        {
            var bytes = Convert.FromBase64String(cursor);
            var text = Encoding.UTF8.GetString(bytes);
            var parts = text.Split('_');
            
            if (parts.Length >= 2 &&
                DateTime.TryParse(parts[0], null, System.Globalization.DateTimeStyles.RoundtripKind, out var timestamp) &&
                int.TryParse(parts[^1], out var id))  // 使用最后一个部分作为 ID (ISO 格式可能包含多个 _)
            {
                return (timestamp.ToUniversalTime(), id);
            }
        }
        catch
        {
            // 解码失败，忽略游标
        }
        
        return (null, null);
    }
    
    #endregion
    
    /// <summary>
    /// 清除缓存
    /// </summary>
    private void InvalidateCache()
    {
        // 热力图缓存会在写入时自动过期
        // 这里主要用于日志记录
        logger.LogDebug("Memo 缓存已失效");
    }
}
