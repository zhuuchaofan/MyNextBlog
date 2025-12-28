// Services/AnniversaryReminderService.cs
// 纪念日提醒服务实现

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services.Email;

namespace MyNextBlog.Services;

/// <summary>
/// 纪念日提醒服务
/// 检查即将到来的纪念日并发送邮件提醒
/// </summary>
public class AnniversaryReminderService(
    AppDbContext context,
    IEmailService emailService,
    ILogger<AnniversaryReminderService> logger) : IAnniversaryReminderService
{
    /// <summary>
    /// 检查并发送所有到期的纪念日提醒
    /// </summary>
    public async Task CheckAndSendRemindersAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        
        // 获取所有开启提醒的纪念日
        var anniversaries = await context.Anniversaries
            .AsNoTracking()
            .Where(a => a.IsActive && a.EnableReminder && !string.IsNullOrEmpty(a.ReminderEmail))
            .ToListAsync();
        
        logger.LogInformation("检查纪念日提醒: 找到 {Count} 个开启提醒的纪念日", anniversaries.Count);
        
        foreach (var anniversary in anniversaries)
        {
            await ProcessAnniversaryReminder(anniversary, today);
        }
    }
    
    /// <summary>
    /// 处理单个纪念日的提醒
    /// </summary>
    private async Task ProcessAnniversaryReminder(Anniversary anniversary, DateOnly today)
    {
        // 计算下一个纪念日日期
        var nextAnniversaryDate = CalculateNextAnniversaryDate(anniversary.StartDate, anniversary.RepeatType, today);
        if (nextAnniversaryDate == null)
        {
            logger.LogDebug("纪念日 {Title} 无下一个日期（一次性且已过）", anniversary.Title);
            return;
        }
        
        // 计算距离下一个纪念日的天数
        var daysUntil = nextAnniversaryDate.Value.DayNumber - today.DayNumber;
        
        // 解析提醒天数配置
        var reminderDays = ParseReminderDays(anniversary.ReminderDays);
        
        foreach (var daysBefore in reminderDays)
        {
            if (daysUntil == daysBefore)
            {
                // 检查是否已发送过
                var alreadySent = await context.AnniversaryNotifications
                    .AnyAsync(n => 
                        n.AnniversaryId == anniversary.Id && 
                        n.TargetDate == nextAnniversaryDate.Value && 
                        n.DaysBefore == daysBefore);
                
                if (alreadySent)
                {
                    logger.LogDebug("纪念日 {Title} 提前{Days}天提醒已发送过", anniversary.Title, daysBefore);
                    continue;
                }
                
                // 发送提醒
                await SendReminderEmail(anniversary, nextAnniversaryDate.Value, daysBefore);
            }
        }
    }
    
    /// <summary>
    /// 计算下一个纪念日日期
    /// </summary>
    private static DateOnly? CalculateNextAnniversaryDate(DateOnly startDate, string repeatType, DateOnly today)
    {
        switch (repeatType)
        {
            case "yearly":
                // 今年的纪念日
                var thisYear = new DateOnly(today.Year, startDate.Month, startDate.Day);
                if (thisYear >= today)
                    return thisYear;
                // 否则返回明年
                return new DateOnly(today.Year + 1, startDate.Month, startDate.Day);
                
            case "monthly":
                // 这个月的纪念日
                var thisMonth = new DateOnly(today.Year, today.Month, Math.Min(startDate.Day, DateTime.DaysInMonth(today.Year, today.Month)));
                if (thisMonth >= today)
                    return thisMonth;
                // 否则返回下个月
                var nextMonth = today.AddMonths(1);
                return new DateOnly(nextMonth.Year, nextMonth.Month, Math.Min(startDate.Day, DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month)));
                
            case "once":
                // 一次性：只有起始日期在今天之后（含）才返回
                return startDate >= today ? startDate : null;
                
            default:
                return null;
        }
    }
    
    /// <summary>
    /// 解析提醒天数配置
    /// </summary>
    private static List<int> ParseReminderDays(string reminderDays)
    {
        if (string.IsNullOrEmpty(reminderDays))
            return [7, 1, 0]; // 默认值
        
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
    private async Task SendReminderEmail(Anniversary anniversary, DateOnly targetDate, int daysBefore)
    {
        var notification = new AnniversaryNotification
        {
            AnniversaryId = anniversary.Id,
            TargetDate = targetDate,
            DaysBefore = daysBefore,
            SentAt = DateTime.UtcNow
        };
        
        try
        {
            var subject = daysBefore == 0
                ? $"💕 今天是「{anniversary.Title}」纪念日！"
                : $"💕 纪念日提醒：「{anniversary.Title}」还有 {daysBefore} 天";
            
            var daysTotal = DateOnly.FromDateTime(DateTime.UtcNow).DayNumber - anniversary.StartDate.DayNumber;
            
            var body = $"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #ec4899;">{anniversary.Emoji} {anniversary.Title}</h2>
                    
                    {(daysBefore == 0 
                        ? "<p style='font-size: 18px; color: #333;'>🎉 <strong>今天</strong>就是纪念日！</p>"
                        : $"<p style='font-size: 18px; color: #333;'>距离纪念日还有 <strong>{daysBefore}</strong> 天</p>")}
                    
                    <div style="background: #fdf2f8; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <p style="margin: 8px 0;"><strong>📅 日期：</strong>{targetDate:yyyy年M月d日}</p>
                        <p style="margin: 8px 0;"><strong>⏰ 起始日期：</strong>{anniversary.StartDate:yyyy年M月d日}</p>
                        <p style="margin: 8px 0;"><strong>💗 已经：</strong>{daysTotal} 天</p>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">—— 来自 MyNextBlog 的温馨提醒</p>
                </div>
                """;
            
            await emailService.SendEmailAsync(anniversary.ReminderEmail!, subject, body);
            
            notification.IsSuccess = true;
            logger.LogInformation("已发送纪念日提醒: {Title} 提前{Days}天 -> {Email}", 
                anniversary.Title, daysBefore, anniversary.ReminderEmail);
        }
        catch (Exception ex)
        {
            notification.IsSuccess = false;
            notification.ErrorMessage = ex.Message;
            logger.LogError(ex, "发送纪念日提醒失败: {Title} -> {Email}", 
                anniversary.Title, anniversary.ReminderEmail);
        }
        
        // 记录发送结果（成功或失败都记录，防止重复发送）
        context.AnniversaryNotifications.Add(notification);
        await context.SaveChangesAsync();
    }
}
