// Models/AnniversaryNotification.cs
// 纪念日提醒发送记录，用于防止重复发送

namespace MyNextBlog.Models;

/// <summary>
/// 纪念日提醒发送记录
/// 记录已发送的提醒，避免同一提醒重复发送
/// </summary>
public class AnniversaryNotification
{
    public int Id { get; set; }
    
    /// <summary>
    /// 关联的纪念日 ID
    /// </summary>
    public int AnniversaryId { get; set; }
    
    /// <summary>
    /// 关联的纪念日
    /// </summary>
    public Anniversary? Anniversary { get; set; }
    
    /// <summary>
    /// 目标纪念日期（下一个纪念日的日期）
    /// </summary>
    public DateOnly TargetDate { get; set; }
    
    /// <summary>
    /// 提前天数 (0=当天, 1=提前1天, 7=提前一周...)
    /// </summary>
    public int DaysBefore { get; set; }
    
    /// <summary>
    /// 发送时间
    /// </summary>
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 发送是否成功
    /// </summary>
    public bool IsSuccess { get; set; } = true;
    
    /// <summary>
    /// 错误信息（如果发送失败）
    /// </summary>
    public string? ErrorMessage { get; set; }
}
