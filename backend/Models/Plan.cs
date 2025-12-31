// ============================================================================
// Models/Plan.cs - 计划/行程实体
// ============================================================================
// 此实体映射 `Plans` 表，是计划模块的核心。
//
// **特性**:
//   - 结构: Plan -> PlanDay -> PlanActivity
//   - 预算: Budget vs ActualCost
//   - 提醒: 集成邮件提醒配置

// `namespace` 声明了当前文件所属的命名空间
// 提示：Models 命名空间用于存放数据实体定义
namespace MyNextBlog.Models;

/// <summary>
/// `Plan` 实体代表一个完整的计划项目。
/// 支持关联纪念日，可配置多日行程、预算和自动提醒。
/// </summary>
public class Plan
{
    public int Id { get; set; }
    
    // --- 可选关联纪念日 ---
    public int? AnniversaryId { get; set; }
    public Anniversary? Anniversary { get; set; }
    
    /// <summary>
    /// 计划标题，如 "东京5日游"
    /// </summary>
    public required string Title { get; set; }
    
    /// <summary>
    /// 计划描述
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// 计划类型: "trip" (旅行) | "event" (活动) | "surprise" (惊喜)
    /// </summary>
    public string Type { get; set; } = "trip";
    
    /// <summary>
    /// 开始日期
    /// </summary>
    public required DateOnly StartDate { get; set; }
    
    /// <summary>
    /// 结束日期（多日计划）
    /// </summary>
    public DateOnly? EndDate { get; set; }
    
    // --- 预算追踪 ---
    
    /// <summary>
    /// 预算金额
    /// </summary>
    public decimal Budget { get; set; } = 0;
    
    /// <summary>
    /// 实际花费
    /// </summary>
    public decimal ActualCost { get; set; } = 0;
    
    /// <summary>
    /// 货币类型: "CNY" | "JPY" | "USD" 等
    /// </summary>
    public string Currency { get; set; } = "CNY";
    
    // --- 状态与标记 ---
    
    /// <summary>
    /// 状态: "draft" (草稿) | "confirmed" (已确认) | "completed" (已完成)
    /// </summary>
    public string Status { get; set; } = "draft";
    
    /// <summary>
    /// 惊喜标记：用于当天弹窗提醒自己
    /// </summary>
    public bool IsSecret { get; set; } = false;
    
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
    /// 提前提醒天数，逗号分隔，如 "7,3,1,0"
    /// </summary>
    public string ReminderDays { get; set; } = "7,3,1,0";
    
    // --- 时间戳 ---
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // --- 导航属性 ---
    
    /// <summary>
    /// 计划包含的每日行程
    /// </summary>
    public ICollection<PlanDay> Days { get; set; } = [];
}
