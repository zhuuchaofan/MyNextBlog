// Models/PlanActivity.cs
// 活动项：每天包含多个活动，支持时间、地点、花费

namespace MyNextBlog.Models;

/// <summary>
/// 活动项实体，属于某个 PlanDay
/// </summary>
public class PlanActivity
{
    public int Id { get; set; }
    
    // --- 外键关联 ---
    
    public int PlanDayId { get; set; }
    public PlanDay PlanDay { get; set; } = null!;
    
    /// <summary>
    /// 时间，如 "09:00"
    /// </summary>
    public string? Time { get; set; }
    
    /// <summary>
    /// 活动标题，如 "参观浅草寺"
    /// </summary>
    public required string Title { get; set; }
    
    /// <summary>
    /// 地点，如 "东京都台东区"
    /// </summary>
    public string? Location { get; set; }
    
    /// <summary>
    /// 备注
    /// </summary>
    public string? Notes { get; set; }
    
    // --- 预算追踪 ---
    
    /// <summary>
    /// 预估花费
    /// </summary>
    public decimal EstimatedCost { get; set; } = 0;
    
    /// <summary>
    /// 实际花费
    /// </summary>
    public decimal ActualCost { get; set; } = 0;
    
    /// <summary>
    /// 排序顺序
    /// </summary>
    public int SortOrder { get; set; } = 0;
}
