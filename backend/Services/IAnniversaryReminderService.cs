// Services/IAnniversaryReminderService.cs
// 纪念日提醒服务接口

namespace MyNextBlog.Services;

/// <summary>
/// 纪念日提醒服务接口
/// </summary>
public interface IAnniversaryReminderService
{
    /// <summary>
    /// 检查并发送所有到期的纪念日提醒
    /// </summary>
    Task CheckAndSendRemindersAsync();
}
