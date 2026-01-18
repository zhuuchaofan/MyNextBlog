// Services/TodoReminderService.cs
// 待办任务提醒服务实现

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.Services.Email;

namespace MyNextBlog.Services;

/// <summary>
/// 待办任务提醒服务
/// 检查到期的任务并发送邮件提醒
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
        var now = DateTime.UtcNow;
        
        // 获取需要提醒的任务
        var tasks = await context.TodoTasks
            .Where(t => t.ReminderEnabled && !t.ReminderSent)
            .Where(t => t.ReminderTime != null && t.ReminderTime <= now)
            .Where(t => t.Stage != "done") // 已完成的任务不提醒
            .ToListAsync();
        
        if (tasks.Count == 0)
        {
            logger.LogDebug("无待发送的任务提醒");
            return;
        }
        
        logger.LogInformation("待发送任务提醒: {Count} 个任务", tasks.Count);
        
        // 获取管理员邮箱
        var adminEmail = await GetAdminEmailAsync();
        if (string.IsNullOrEmpty(adminEmail))
        {
            logger.LogWarning("未找到管理员邮箱，无法发送任务提醒");
            return;
        }
        
        foreach (var task in tasks)
        {
            await SendReminderEmail(task, adminEmail);
        }
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
    private async Task SendReminderEmail(Models.TodoTask task, string email)
    {
        try
        {
            var rendered = await templateService.RenderAsync("todo_due_remind", new Dictionary<string, string>
            {
                ["TaskTitle"] = task.Title,
                ["TaskDescription"] = task.Description ?? "无描述",
                ["Priority"] = GetPriorityLabel(task.Priority),
                ["Stage"] = GetStageLabel(task.Stage),
                ["DueDate"] = task.DueDate?.ToString("yyyy年M月d日 HH:mm") ?? "未设置",
                ["StartDate"] = task.StartDate?.ToString("yyyy年M月d日") ?? "未设置"
            });
            
            if (!rendered.HasValue)
            {
                logger.LogWarning("任务提醒邮件模板未启用或不存在: todo_due_remind");
                return;
            }
            
            await emailService.SendEmailAsync(email, rendered.Value.Subject, rendered.Value.Body);
            
            // 标记为已发送
            task.ReminderSent = true;
            await context.SaveChangesAsync();
            
            logger.LogInformation("已发送任务提醒: {Title} -> {Email}", task.Title, email);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "发送任务提醒失败: {Title} -> {Email}", task.Title, email);
        }
    }
    
    /// <summary>
    /// 获取优先级显示文本
    /// </summary>
    private static string GetPriorityLabel(string priority) => priority switch
    {
        "high" => "🔴 高",
        "medium" => "🟡 中",
        "low" => "🟢 低",
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
