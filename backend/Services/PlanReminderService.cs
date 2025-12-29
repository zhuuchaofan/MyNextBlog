// Services/PlanReminderService.cs
// 计划提醒服务实现

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.Services.Email;

namespace MyNextBlog.Services;

/// <summary>
/// 计划提醒服务
/// 检查即将到来的计划并发送邮件提醒
/// </summary>
public class PlanReminderService(
    AppDbContext context,
    IEmailService emailService,
    IEmailTemplateService templateService,
    ILogger<PlanReminderService> logger) : IPlanReminderService
{
    /// <summary>
    /// 检查并发送所有到期的计划提醒
    /// </summary>
    public async Task CheckAndSendRemindersAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        
        // 获取所有开启提醒的计划
        var plans = await context.Plans
            .AsNoTracking()
            .Include(p => p.Days)
                .ThenInclude(d => d.Activities)
            .Where(p => p.EnableReminder && !string.IsNullOrEmpty(p.ReminderEmail))
            .Where(p => p.Status != "completed") // 排除已完成的
            .ToListAsync();
        
        logger.LogInformation("检查计划提醒: 找到 {Count} 个开启提醒的计划", plans.Count);
        
        foreach (var plan in plans)
        {
            await ProcessPlanReminder(plan, today);
        }
    }
    
    /// <summary>
    /// 处理单个计划的提醒
    /// </summary>
    private async Task ProcessPlanReminder(Models.Plan plan, DateOnly today)
    {
        // 计算距离计划开始日期的天数
        var daysUntil = plan.StartDate.DayNumber - today.DayNumber;
        
        // 如果计划已经开始或过去，不再发送提醒
        if (daysUntil < 0)
        {
            logger.LogDebug("计划 {Title} 已开始或过去", plan.Title);
            return;
        }
        
        // 解析提醒天数配置
        var reminderDays = ParseReminderDays(plan.ReminderDays);
        
        foreach (var daysBefore in reminderDays)
        {
            if (daysUntil == daysBefore)
            {
                // 发送提醒
                await SendReminderEmail(plan, daysBefore);
            }
        }
    }
    
    /// <summary>
    /// 解析提醒天数配置
    /// </summary>
    private static List<int> ParseReminderDays(string reminderDays)
    {
        if (string.IsNullOrEmpty(reminderDays))
            return [7, 3, 1, 0]; // 默认值
        
        return reminderDays
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => int.TryParse(s.Trim(), out var d) ? d : -1)
            .Where(d => d >= 0)
            .OrderByDescending(d => d)
            .ToList();
    }
    
    /// <summary>
    /// 发送提醒邮件
    /// </summary>
    private async Task SendReminderEmail(Models.Plan plan, int daysRemaining)
    {
        try
        {
            // 生成行程概要
            var daysSummary = GenerateDaysSummary(plan);
            
            var rendered = await templateService.RenderAsync("plan_reminder", new Dictionary<string, string>
            {
                ["PlanTitle"] = plan.Title,
                ["StartDate"] = plan.StartDate.ToString("yyyy年M月d日"),
                ["EndDate"] = plan.EndDate?.ToString("yyyy年M月d日") ?? plan.StartDate.ToString("yyyy年M月d日"),
                ["DaysRemaining"] = daysRemaining.ToString(),
                ["Budget"] = $"{plan.Currency} {plan.Budget:N0}",
                ["DaysSummary"] = daysSummary
            });
            
            if (!rendered.HasValue)
            {
                logger.LogWarning("计划邮件模板未启用或不存在: plan_reminder");
                return;
            }
            
            await emailService.SendEmailAsync(plan.ReminderEmail!, rendered.Value.Subject, rendered.Value.Body);
            logger.LogInformation("已发送计划提醒: {Title} 提前{Days}天 -> {Email}", 
                plan.Title, daysRemaining, plan.ReminderEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "发送计划提醒失败: {Title} -> {Email}", 
                plan.Title, plan.ReminderEmail);
        }
    }
    
    /// <summary>
    /// 生成行程概要 HTML
    /// </summary>
    private static string GenerateDaysSummary(Models.Plan plan)
    {
        if (plan.Days == null || plan.Days.Count == 0)
            return "<p>暂无详细行程</p>";
        
        var summary = plan.Days
            .OrderBy(d => d.DayNumber)
            .Select(d => $"<p><strong>Day {d.DayNumber}:</strong> {d.Theme ?? "暂无主题"}</p>");
        
        return string.Join("", summary);
    }
}
