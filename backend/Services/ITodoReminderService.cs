// Services/ITodoReminderService.cs
// 待办任务提醒服务接口

namespace MyNextBlog.Services;

/// <summary>
/// 待办任务提醒服务接口
/// </summary>
public interface ITodoReminderService
{
    /// <summary>
    /// 检查并发送所有到期的任务提醒
    /// </summary>
    Task CheckAndSendRemindersAsync();
}
