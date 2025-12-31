// ============================================================================
// Services/AnniversaryService.cs - 纪念日服务实现
// ============================================================================
// 此服务负责纪念日功能的核心业务逻辑，包括：
//   - 纪念日的 CRUD 操作
//   - 公开展示 (IsActive = true 的纪念日)
//   - 管理后台 (支持排序和状态切换)
//   - 日期计算 (天数差、下次纪念日等)
//
// **日期处理**: 使用 DateOnly.TryParse 安全解析，无效日期返回 400
// **缓存策略**: 内存缓存 30 分钟，公开 API 自动失效

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;  // EF Core 数据库操作
using MyNextBlog.Data;                // 数据访问层
using MyNextBlog.DTOs;                // 数据传输对象
using MyNextBlog.Models;              // 领域模型

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `AnniversaryService` 是纪念日模块的核心服务类，实现 `IAnniversaryService` 接口。
/// 
/// **主要功能**:
///   - `GetActiveAnniversariesAsync`: 获取所有启用的纪念日 (公开 API)
///   - `GetAllAsync`: 获取所有纪念日 (管理后台)
///   - CRUD 操作: 创建、更新、删除纪念日
///   - `ToggleActiveAsync`: 切换纪念日的启用状态
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
                a.DisplayType,
                today.DayNumber - a.StartDate.DayNumber  // 已过天数
            ))
            .ToListAsync();
    }
    
    /// <summary>
    /// 获取所有纪念日（管理后台）
    /// </summary>
    public async Task<List<AnniversaryAdminDto>> GetAllAnniversariesAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        
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
                a.DisplayType,
                a.IsActive,
                a.DisplayOrder,
                today.DayNumber - a.StartDate.DayNumber,  // 已过天数
                a.EnableReminder,
                a.ReminderEmail,
                a.ReminderDays,
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
        // 安全解析日期
        if (!DateOnly.TryParse(dto.StartDate, out var startDate))
            throw new ArgumentException($"日期格式无效: {dto.StartDate}");
        
        var anniversary = new Anniversary
        {
            Title = dto.Title,
            Emoji = dto.Emoji,
            StartDate = startDate,
            RepeatType = dto.RepeatType,
            DisplayType = dto.DisplayType,
            EnableReminder = dto.EnableReminder,
            ReminderEmail = dto.ReminderEmail,
            ReminderDays = dto.ReminderDays,
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
        
        // 安全解析日期
        if (!DateOnly.TryParse(dto.StartDate, out var startDate))
            throw new ArgumentException($"日期格式无效: {dto.StartDate}");
        
        anniversary.Title = dto.Title;
        anniversary.Emoji = dto.Emoji;
        anniversary.StartDate = startDate;
        anniversary.RepeatType = dto.RepeatType;
        anniversary.DisplayType = dto.DisplayType;
        
        if (dto.IsActive.HasValue)
            anniversary.IsActive = dto.IsActive.Value;
        
        if (dto.DisplayOrder.HasValue)
            anniversary.DisplayOrder = dto.DisplayOrder.Value;
        
        // 邮件提醒配置
        if (dto.EnableReminder.HasValue)
            anniversary.EnableReminder = dto.EnableReminder.Value;
        
        if (dto.ReminderEmail != null)
            anniversary.ReminderEmail = dto.ReminderEmail;
        
        if (dto.ReminderDays != null)
            anniversary.ReminderDays = dto.ReminderDays;
        
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
