// Services/AnniversaryService.cs
// 纪念日服务实现

using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 纪念日服务实现，提供纪念日的 CRUD 操作
/// </summary>
public class AnniversaryService(AppDbContext context) : IAnniversaryService
{
    /// <summary>
    /// 获取所有启用的纪念日（公开 API）
    /// 返回按 DisplayOrder 排序的纪念日列表
    /// </summary>
    public async Task<List<AnniversaryDto>> GetActiveAnniversariesAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        
        return await context.Anniversaries
            .AsNoTracking()
            .Where(a => a.IsActive)
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.StartDate)
            .Select(a => new AnniversaryDto(
                a.Id,
                a.Title,
                a.Emoji,
                a.StartDate.ToString("yyyy-MM-dd"),
                a.RepeatType,
                today.DayNumber - a.StartDate.DayNumber  // 已过天数
            ))
            .ToListAsync();
    }
    
    /// <summary>
    /// 获取所有纪念日（管理后台）
    /// </summary>
    public async Task<List<AnniversaryAdminDto>> GetAllAnniversariesAsync()
    {
        return await context.Anniversaries
            .AsNoTracking()
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.StartDate)
            .Select(a => new AnniversaryAdminDto(
                a.Id,
                a.Title,
                a.Emoji,
                a.StartDate.ToString("yyyy-MM-dd"),
                a.RepeatType,
                a.IsActive,
                a.DisplayOrder,
                a.CreatedAt,
                a.UpdatedAt
            ))
            .ToListAsync();
    }
    
    /// <summary>
    /// 根据 ID 获取单个纪念日
    /// </summary>
    public async Task<Anniversary?> GetByIdAsync(int id)
    {
        return await context.Anniversaries.FindAsync(id);
    }
    
    /// <summary>
    /// 创建新纪念日
    /// </summary>
    public async Task<Anniversary> CreateAsync(CreateAnniversaryDto dto)
    {
        var anniversary = new Anniversary
        {
            Title = dto.Title,
            Emoji = dto.Emoji,
            StartDate = DateOnly.Parse(dto.StartDate),
            RepeatType = dto.RepeatType,
            IsActive = true,
            DisplayOrder = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        context.Anniversaries.Add(anniversary);
        await context.SaveChangesAsync();
        
        return anniversary;
    }
    
    /// <summary>
    /// 更新纪念日
    /// </summary>
    public async Task<Anniversary?> UpdateAsync(int id, UpdateAnniversaryDto dto)
    {
        var anniversary = await context.Anniversaries.FindAsync(id);
        if (anniversary == null) return null;
        
        anniversary.Title = dto.Title;
        anniversary.Emoji = dto.Emoji;
        anniversary.StartDate = DateOnly.Parse(dto.StartDate);
        anniversary.RepeatType = dto.RepeatType;
        
        if (dto.IsActive.HasValue)
            anniversary.IsActive = dto.IsActive.Value;
        
        if (dto.DisplayOrder.HasValue)
            anniversary.DisplayOrder = dto.DisplayOrder.Value;
        
        anniversary.UpdatedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync();
        return anniversary;
    }
    
    /// <summary>
    /// 删除纪念日
    /// </summary>
    public async Task<bool> DeleteAsync(int id)
    {
        var anniversary = await context.Anniversaries.FindAsync(id);
        if (anniversary == null) return false;
        
        context.Anniversaries.Remove(anniversary);
        await context.SaveChangesAsync();
        return true;
    }
}
