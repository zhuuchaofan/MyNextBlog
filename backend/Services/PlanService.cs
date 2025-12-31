// Services/PlanService.cs
// 计划服务实现

using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 计划服务实现，提供计划 CRUD 及嵌套日程/活动管理
/// </summary>
public class PlanService(AppDbContext context) : IPlanService
{
    // ========== Plan CRUD ==========
    
    public async Task<List<PlanListDto>> GetAllPlansAsync()
    {
        return await context.Plans
            .AsNoTracking()
            .Include(p => p.Anniversary)
            .Include(p => p.Days)
            .OrderByDescending(p => p.StartDate)
            .Select(p => new PlanListDto(
                p.Id,
                p.Title,
                p.Type,
                p.StartDate.ToString("yyyy-MM-dd"),
                p.EndDate != null ? p.EndDate.Value.ToString("yyyy-MM-dd") : null,
                p.Budget,
                p.ActualCost,
                p.Currency,
                p.Status,
                p.IsSecret,
                p.AnniversaryId,
                p.Anniversary != null ? p.Anniversary.Title : null,
                p.EndDate != null ? (p.EndDate.Value.DayNumber - p.StartDate.DayNumber + 1) : 1,
                p.CreatedAt
            ))
            .ToListAsync();
    }
    
    public async Task<PlanDetailDto?> GetPlanByIdAsync(int id)
    {
        var plan = await context.Plans
            .AsNoTracking()
            .Include(p => p.Anniversary)
            .Include(p => p.Days)
                .ThenInclude(d => d.Activities.OrderBy(a => a.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == id);
        
        if (plan == null) return null;
        
        return new PlanDetailDto(
            plan.Id,
            plan.Title,
            plan.Description,
            plan.Type,
            plan.StartDate.ToString("yyyy-MM-dd"),
            plan.EndDate?.ToString("yyyy-MM-dd"),
            plan.Budget,
            plan.ActualCost,
            plan.Currency,
            plan.Status,
            plan.IsSecret,
            plan.EnableReminder,
            plan.ReminderEmail,
            plan.ReminderDays,
            plan.AnniversaryId,
            plan.Anniversary?.Title,
            plan.Days
                .OrderBy(d => d.DayNumber)
                .Select(d => new PlanDayDto(
                    d.Id,
                    d.DayNumber,
                    d.Date.ToString("yyyy-MM-dd"),
                    d.Theme,
                    d.Activities
                        .OrderBy(a => a.SortOrder)
                        .Select(a => new PlanActivityDto(
                            a.Id,
                            a.Time,
                            a.Title,
                            a.Location,
                            a.Notes,
                            a.EstimatedCost,
                            a.ActualCost,
                            a.SortOrder
                        ))
                        .ToList()
                ))
                .ToList(),
            plan.CreatedAt,
            plan.UpdatedAt
        );
    }
    
    public async Task<Plan> CreatePlanAsync(CreatePlanDto dto)
    {
        // 安全解析日期，防止格式错误导致 500
        if (!DateOnly.TryParse(dto.StartDate, out var startDate))
            throw new ArgumentException($"开始日期格式无效: {dto.StartDate}");
        
        DateOnly? endDate = null;
        if (dto.EndDate != null)
        {
            if (!DateOnly.TryParse(dto.EndDate, out var parsedEndDate))
                throw new ArgumentException($"结束日期格式无效: {dto.EndDate}");
            
            // 业务校验：结束日期必须 >= 开始日期
            if (parsedEndDate < startDate)
                throw new ArgumentException("结束日期不能早于开始日期");
            
            endDate = parsedEndDate;
        }
        
        var plan = new Plan
        {
            Title = dto.Title,
            Description = dto.Description,
            Type = dto.Type,
            StartDate = startDate,
            EndDate = endDate,
            Budget = dto.Budget,
            Currency = dto.Currency,
            IsSecret = dto.IsSecret,
            EnableReminder = dto.EnableReminder,
            ReminderEmail = dto.ReminderEmail,
            ReminderDays = dto.ReminderDays,
            AnniversaryId = dto.AnniversaryId
        };
        
        context.Plans.Add(plan);
        await context.SaveChangesAsync();
        
        return plan;
    }
    
    public async Task<Plan?> UpdatePlanAsync(int id, UpdatePlanDto dto)
    {
        var plan = await context.Plans.FindAsync(id);
        if (plan == null) return null;
        
        if (dto.Title != null) plan.Title = dto.Title;
        if (dto.Description != null) plan.Description = dto.Description;
        if (dto.Type != null) plan.Type = dto.Type;
        
        // 安全解析日期
        if (dto.StartDate != null)
        {
            if (!DateOnly.TryParse(dto.StartDate, out var startDate))
                throw new ArgumentException($"开始日期格式无效: {dto.StartDate}");
            plan.StartDate = startDate;
        }
        if (dto.EndDate != null)
        {
            if (!DateOnly.TryParse(dto.EndDate, out var endDate))
                throw new ArgumentException($"结束日期格式无效: {dto.EndDate}");
            
            // 业务校验：结束日期必须 >= 开始日期
            if (endDate < plan.StartDate)
                throw new ArgumentException("结束日期不能早于开始日期");
            
            plan.EndDate = endDate;
        }
        
        if (dto.Budget.HasValue) plan.Budget = dto.Budget.Value;
        if (dto.ActualCost.HasValue) plan.ActualCost = dto.ActualCost.Value;
        if (dto.Currency != null) plan.Currency = dto.Currency;
        if (dto.Status != null) plan.Status = dto.Status;
        if (dto.IsSecret.HasValue) plan.IsSecret = dto.IsSecret.Value;
        if (dto.EnableReminder.HasValue) plan.EnableReminder = dto.EnableReminder.Value;
        if (dto.ReminderEmail != null) plan.ReminderEmail = dto.ReminderEmail;
        if (dto.ReminderDays != null) plan.ReminderDays = dto.ReminderDays;
        if (dto.AnniversaryId.HasValue) plan.AnniversaryId = dto.AnniversaryId;
        
        plan.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        
        return plan;
    }
    
    public async Task<bool> DeletePlanAsync(int id)
    {
        var plan = await context.Plans.FindAsync(id);
        if (plan == null) return false;
        
        context.Plans.Remove(plan);
        await context.SaveChangesAsync();
        
        return true;
    }
    
    // ========== PlanDay CRUD ==========
    
    public async Task<PlanDay> AddDayAsync(int planId, CreatePlanDayDto dto)
    {
        // 安全解析日期
        if (!DateOnly.TryParse(dto.Date, out var date))
            throw new ArgumentException($"日期格式无效: {dto.Date}");
        
        var day = new PlanDay
        {
            PlanId = planId,
            DayNumber = dto.DayNumber,
            Date = date,
            Theme = dto.Theme
        };
        
        context.PlanDays.Add(day);
        await context.SaveChangesAsync();
        
        return day;
    }
    
    public async Task<PlanDay?> UpdateDayAsync(int dayId, UpdatePlanDayDto dto)
    {
        var day = await context.PlanDays.FindAsync(dayId);
        if (day == null) return null;
        
        if (dto.DayNumber.HasValue) day.DayNumber = dto.DayNumber.Value;
        if (dto.Date != null)
        {
            if (!DateOnly.TryParse(dto.Date, out var date))
                throw new ArgumentException($"日期格式无效: {dto.Date}");
            day.Date = date;
        }
        if (dto.Theme != null) day.Theme = dto.Theme;
        
        await context.SaveChangesAsync();
        
        return day;
    }
    
    public async Task<bool> DeleteDayAsync(int dayId)
    {
        var day = await context.PlanDays.FindAsync(dayId);
        if (day == null) return false;
        
        context.PlanDays.Remove(day);
        await context.SaveChangesAsync();
        
        return true;
    }
    
    // ========== PlanActivity CRUD ==========
    
    public async Task<PlanActivity> AddActivityAsync(int dayId, CreateActivityDto dto)
    {
        var activity = new PlanActivity
        {
            PlanDayId = dayId,
            Time = dto.Time,
            Title = dto.Title,
            Location = dto.Location,
            Notes = dto.Notes,
            EstimatedCost = dto.EstimatedCost,
            SortOrder = dto.SortOrder
        };
        
        context.PlanActivities.Add(activity);
        await context.SaveChangesAsync();
        
        return activity;
    }
    
    public async Task<PlanActivity?> UpdateActivityAsync(int activityId, UpdateActivityDto dto)
    {
        var activity = await context.PlanActivities.FindAsync(activityId);
        if (activity == null) return null;
        
        if (dto.Time != null) activity.Time = dto.Time;
        if (dto.Title != null) activity.Title = dto.Title;
        if (dto.Location != null) activity.Location = dto.Location;
        if (dto.Notes != null) activity.Notes = dto.Notes;
        if (dto.EstimatedCost.HasValue) activity.EstimatedCost = dto.EstimatedCost.Value;
        if (dto.ActualCost.HasValue) activity.ActualCost = dto.ActualCost.Value;
        if (dto.SortOrder.HasValue) activity.SortOrder = dto.SortOrder.Value;
        
        await context.SaveChangesAsync();
        
        return activity;
    }
    
    public async Task<bool> DeleteActivityAsync(int activityId)
    {
        var activity = await context.PlanActivities.FindAsync(activityId);
        if (activity == null) return false;
        
        context.PlanActivities.Remove(activity);
        await context.SaveChangesAsync();
        
        return true;
    }
    
    // ========== 统计方法 ==========
    
    public async Task<(decimal TotalEstimated, decimal TotalActual)> GetBudgetSummaryAsync(int planId)
    {
        var activities = await context.PlanActivities
            .AsNoTracking()
            .Where(a => a.PlanDay.PlanId == planId)
            .ToListAsync();
        
        var totalEstimated = activities.Sum(a => a.EstimatedCost);
        var totalActual = activities.Sum(a => a.ActualCost);
        
        return (totalEstimated, totalActual);
    }
    
    // ========== 批量操作 ==========
    
    /// <summary>
    /// 批量更新活动排序
    /// 使用单次数据库往返，提升拖拽排序性能
    /// </summary>
    public async Task BatchUpdateActivitySortOrderAsync(List<ActivitySortItem> items)
    {
        if (items.Count == 0) return;
        
        // 获取所有需要更新的活动 ID
        var ids = items.Select(i => i.Id).ToList();
        var activities = await context.PlanActivities
            .Where(a => ids.Contains(a.Id))
            .ToListAsync();
        
        // 应用新的排序
        foreach (var activity in activities)
        {
            var item = items.FirstOrDefault(i => i.Id == activity.Id);
            if (item != null)
            {
                activity.SortOrder = item.SortOrder;
            }
        }
        
        await context.SaveChangesAsync();
    }
    
    // ========== 公开 API ==========
    
    /// <summary>
    /// 获取公开预览的计划详情（隐藏预算等敏感信息）
    /// </summary>
    public async Task<PublicPlanDetailDto?> GetPublicPlanByIdAsync(int id)
    {
        var plan = await context.Plans
            .AsNoTracking()
            .Include(p => p.Days)
                .ThenInclude(d => d.Activities.OrderBy(a => a.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == id);
        
        if (plan == null) return null;
        
        // 如果是私密计划，也返回（用于分享给特定人）
        // 如果需要严格限制，可以在这里检查 plan.IsSecret
        
        return new PublicPlanDetailDto(
            plan.Id,
            plan.Title,
            plan.Description,
            plan.Type,
            plan.StartDate.ToString("yyyy-MM-dd"),
            plan.EndDate?.ToString("yyyy-MM-dd"),
            plan.Status,
            plan.Days.OrderBy(d => d.DayNumber).Select(d => new PublicPlanDayDto(
                d.Id,
                d.DayNumber,
                d.Date.ToString("yyyy-MM-dd"),
                d.Theme,
                d.Activities.Select(a => new PublicActivityDto(
                    a.Id,
                    a.Time,
                    a.Title,
                    a.Location,
                    a.Notes,
                    a.SortOrder
                )).ToList()
            )).ToList()
        );
    }
}
