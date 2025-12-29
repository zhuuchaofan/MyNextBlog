// Services/IPlanReminderService.cs
// 计划提醒服务接口

namespace MyNextBlog.Services;

/// <summary>
/// 计划提醒服务接口
/// </summary>
public interface IPlanReminderService
{
    /// <summary>
    /// 检查并发送计划提醒
    /// </summary>
    Task CheckAndSendRemindersAsync();
}
