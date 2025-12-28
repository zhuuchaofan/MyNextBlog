// Models/Anniversary.cs
// 纪念日实体模型，用于存储用户配置的特殊日期

namespace MyNextBlog.Models;

/// <summary>
/// 纪念日实体，支持每年/每月/一次性重复类型
/// </summary>
public class Anniversary
{
    public int Id { get; set; }
    
    /// <summary>
    /// 纪念日标题，如 "相恋纪念日"
    /// </summary>
    public required string Title { get; set; }
    
    /// <summary>
    /// 显示用的 Emoji，如 "💕"
    /// </summary>
    public required string Emoji { get; set; }
    
    /// <summary>
    /// 起始日期（只存日期，避免时区问题）
    /// </summary>
    public required DateOnly StartDate { get; set; }
    
    /// <summary>
    /// 重复类型: "yearly" | "monthly" | "once"
    /// </summary>
    public required string RepeatType { get; set; }
    
    /// <summary>
    /// 显示类型: "duration" (时长：X年X月) | "age" (年龄：X岁)
    /// </summary>
    public string DisplayType { get; set; } = "duration";
    
    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// 显示顺序（数字越小越靠前）
    /// </summary>
    public int DisplayOrder { get; set; } = 0;
    
    // --- 邮件提醒配置 ---
    
    /// <summary>
    /// 是否开启邮件提醒
    /// </summary>
    public bool EnableReminder { get; set; } = false;
    
    /// <summary>
    /// 提醒邮箱地址
    /// </summary>
    public string? ReminderEmail { get; set; }
    
    /// <summary>
    /// 提前提醒天数，逗号分隔，如 "30,15,7,1,0"
    /// 0 表示当天提醒
    /// </summary>
    public string ReminderDays { get; set; } = "7,1,0";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
