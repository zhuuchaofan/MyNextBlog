// Services/TodoReminderService.cs
// 待办任务提醒服务实现 - 支持多次提醒（基于 DueDate 和 ReminderDays）

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.Services.Email;

namespace MyNextBlog.Services;

/// <summary>
/// 待办任务提醒服务
/// 检查即将到期的任务，根据 ReminderDays 在截止前 N 天发送提醒
/// </summary>
public class TodoReminderService(
    AppDbContext context,
    IEmailService emailService,
    IEmailTemplateService templateService,
    ILogger<TodoReminderService> logger) : ITodoReminderService
{
    /// <summary>
    /// 检查并发送所有到期的任务提醒
    /// </summary>
    public async Task CheckAndSendRemindersAsync()
    {
        var today = DateTime.UtcNow.Date;
        
        // 获取需要检查提醒的任务
        // 条件：开启提醒 + 有截止日期 + 未完成
        var tasks = await context.TodoTasks
            .Where(t => t.ReminderEnabled)
            .Where(t => t.DueDate != null)
            .Where(t => t.Stage != "done")
            .ToListAsync();
        
        if (tasks.Count == 0)
        {
            logger.LogDebug("无待检查的任务提醒");
            return;
        }
        
        // 获取管理员邮箱
        var adminEmail = await GetAdminEmailAsync();
        if (string.IsNullOrEmpty(adminEmail))
        {
            logger.LogWarning("未找到管理员邮箱，无法发送任务提醒");
            return;
        }
        
        var sentCount = 0;
        
        foreach (var task in tasks)
        {
            // 解析 ReminderDays (如 "7,3,1,0")
            var reminderDaysList = ParseReminderDays(task.ReminderDays);
            var sentDaysList = ParseReminderDays(task.SentReminderDays ?? "");
            
            // 计算距离截止日期的天数
            var daysUntilDue = (task.DueDate!.Value.Date - today).Days;
            
            // 检查每个提醒天数
            foreach (var reminderDay in reminderDaysList)
            {
                // 如果已到达或超过提醒天数，且尚未发送过此天数的提醒
                if (daysUntilDue <= reminderDay && !sentDaysList.Contains(reminderDay))
                {
                    await SendReminderEmail(task, adminEmail, reminderDay, daysUntilDue);
                    
                    // 更新已发送的天数列表
                    sentDaysList.Add(reminderDay);
                    task.SentReminderDays = string.Join(",", sentDaysList.OrderDescending());
                    await context.SaveChangesAsync();
                    
                    sentCount++;
                }
            }
        }
        
        if (sentCount > 0)
        {
            logger.LogInformation("已发送 {Count} 条任务提醒", sentCount);
        }
    }
    
    /// <summary>
    /// 解析提醒天数列表
    /// </summary>
    private static List<int> ParseReminderDays(string reminderDays)
    {
        if (string.IsNullOrWhiteSpace(reminderDays)) return [];
        
        return reminderDays
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var d) ? d : -1)
            .Where(d => d >= 0)
            .ToList();
    }
    
    /// <summary>
    /// 获取管理员邮箱
    /// </summary>
    private async Task<string?> GetAdminEmailAsync()
    {
        return await context.Users
            .AsNoTracking()
            .Where(u => u.Role == "Admin" && !string.IsNullOrEmpty(u.Email))
            .Select(u => u.Email)
            .FirstOrDefaultAsync();
    }
    
    /// <summary>
    /// 发送提醒邮件
    /// </summary>
    private async Task SendReminderEmail(Models.TodoTask task, string email, int reminderDay, int actualDaysUntilDue)
    {
        try
        {
            // 构建提醒文案
            var daysText = actualDaysUntilDue switch
            {
                < 0 => $"已逾期 {-actualDaysUntilDue} 天",
                0 => "今天截止",
                1 => "明天截止",
                _ => $"还有 {actualDaysUntilDue} 天截止"
            };
            
            var rendered = await templateService.RenderAsync("todo_due_remind", new Dictionary<string, string>
            {
                ["TaskTitle"] = task.Title,
                ["TaskDescription"] = task.Description ?? "无描述",
                ["TaskType"] = GetTaskTypeLabel(task.TaskType),
                ["Priority"] = GetPriorityLabel(task.Priority),
                ["Stage"] = GetStageLabel(task.Stage),
                ["DueDate"] = task.DueDate?.ToString("yyyy年M月d日") ?? "未设置",
                ["StartDate"] = task.StartDate?.ToString("yyyy年M月d日") ?? "未设置",
                ["DaysText"] = daysText,
                ["ReminderDay"] = reminderDay.ToString()
            });
            
            if (!rendered.HasValue)
            {
                logger.LogWarning("任务提醒邮件模板未启用或不存在: todo_due_remind");
                return;
            }
            
            await emailService.SendEmailAsync(email, rendered.Value.Subject, rendered.Value.Body);
            
            logger.LogInformation("已发送任务提醒: {Title} ({DaysText}) -> {Email}", task.Title, daysText, email);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "发送任务提醒失败: {Title} -> {Email}", task.Title, email);
        }
    }
    
    /// <summary>
    /// 获取任务类型显示文本
    /// </summary>
    private static string GetTaskTypeLabel(string taskType) => taskType switch
    {
        "epic" => "史诗",
        "story" => "故事",
        "task" => "任务",
        _ => taskType
    };
    
    /// <summary>
    /// 获取优先级显示文本
    /// </summary>
    private static string GetPriorityLabel(string priority) => priority switch
    {
        "high" => "高",
        "medium" => "中",
        "low" => "低",
        _ => priority
    };
    
    /// <summary>
    /// 获取阶段显示文本
    /// </summary>
    private static string GetStageLabel(string stage) => stage switch
    {
        "todo" => "待办",
        "in_progress" => "进行中",
        "done" => "已完成",
        _ => stage
    };
}
