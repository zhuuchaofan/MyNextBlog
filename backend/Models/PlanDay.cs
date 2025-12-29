// Models/PlanDay.cs
// 每日行程：一个计划包含多天，每天有一个主题

namespace MyNextBlog.Models;

/// <summary>
/// 每日行程实体，属于某个 Plan
/// </summary>
public class PlanDay
{
    public int Id { get; set; }
    
    // --- 外键关联 ---
    
    public int PlanId { get; set; }
    public Plan Plan { get; set; } = null!;
    
    /// <summary>
    /// 第几天 (1, 2, 3...)
    /// </summary>
    public int DayNumber { get; set; }
    
    /// <summary>
    /// 具体日期
    /// </summary>
    public DateOnly Date { get; set; }
    
    /// <summary>
    /// 当天主题，如 "抵达 & 银座购物"
    /// </summary>
    public string? Theme { get; set; }
    
    // --- 导航属性 ---
    
    /// <summary>
    /// 当天的活动列表
    /// </summary>
    public ICollection<PlanActivity> Activities { get; set; } = [];
}
