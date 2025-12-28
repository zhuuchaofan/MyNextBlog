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
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// 显示顺序（数字越小越靠前）
    /// </summary>
    public int DisplayOrder { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
