// ============================================================================
// Models/TodoTask.cs - 待办事项实体
// ============================================================================
// 此实体映射 `TodoTasks` 表，是 Kanban 看板模块的核心。
//
// **特性**:
//   - 阶段流转: todo → in_progress → done
//   - 拖拽排序: SortOrder 字段支持同阶段内排序
//   - 邮件提醒: 到期时发送提醒邮件

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Models;

/// <summary>
/// 待办事项任务实体
/// </summary>
public class TodoTask
{
    public int Id { get; set; }
    
    /// <summary>
    /// 任务标题
    /// </summary>
    [Required, StringLength(100)]
    public required string Title { get; set; }
    
    /// <summary>
    /// 任务描述
    /// </summary>
    [StringLength(500)]
    public string? Description { get; set; }
    
    /// <summary>
    /// 阶段: "todo" | "in_progress" | "done"
    /// </summary>
    [StringLength(20)]
    public string Stage { get; set; } = "todo";
    
    /// <summary>
    /// 优先级: "low" | "medium" | "high"
    /// </summary>
    [StringLength(10)]
    public string Priority { get; set; } = "medium";
    
    /// <summary>
    /// 同阶段内排序顺序
    /// </summary>
    public int SortOrder { get; set; }
    
    /// <summary>
    /// 开始日期
    /// </summary>
    public DateTime? StartDate { get; set; }
    
    /// <summary>
    /// 截止日期
    /// </summary>
    public DateTime? DueDate { get; set; }
    
    // --- 提醒逻辑 ---
    
    /// <summary>
    /// 是否开启提醒
    /// </summary>
    public bool ReminderEnabled { get; set; }
    
    /// <summary>
    /// 具体提醒时间
    /// </summary>
    public DateTime? ReminderTime { get; set; }
    
    /// <summary>
    /// 提醒是否已发送（防止重复发送）
    /// </summary>
    public bool ReminderSent { get; set; }
    
    // --- 审计字段 ---
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
