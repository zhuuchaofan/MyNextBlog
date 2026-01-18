// ============================================================================
// Models/TodoTask.cs - 待办事项实体
// ============================================================================
// 此实体映射 `TodoTasks` 表，是 Kanban 看板模块的核心。
//
// **特性**:
//   - 三层结构: Epic → Story → Task
//   - 阶段流转: todo → in_progress → done
//   - 拖拽排序: SortOrder 字段支持同阶段内排序
//   - 多次提醒: 截止前 N 天发送提醒邮件

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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
    /// 任务类型: "epic" | "story" | "task"
    /// </summary>
    [StringLength(20)]
    public string TaskType { get; set; } = "task";
    
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
    
    // --- 层级结构 ---
    
    /// <summary>
    /// 父任务 ID (null = 顶级任务)
    /// </summary>
    public int? ParentId { get; set; }
    
    /// <summary>
    /// 父任务导航属性
    /// </summary>
    [ForeignKey(nameof(ParentId))]
    public TodoTask? Parent { get; set; }
    
    /// <summary>
    /// 子任务集合
    /// </summary>
    public List<TodoTask> Children { get; set; } = [];
    
    // --- 多次提醒 ---
    
    /// <summary>
    /// 是否开启提醒
    /// </summary>
    public bool ReminderEnabled { get; set; }
    
    /// <summary>
    /// 提醒天数列表 (截止前 N 天提醒)
    /// 格式: "7,3,1,0"
    /// </summary>
    [StringLength(50)]
    public string ReminderDays { get; set; } = "7,3,1,0";
    
    /// <summary>
    /// 已发送的提醒天数 (防止重复发送)
    /// 格式: "7,3" 表示 7 天和 3 天的提醒已发送
    /// </summary>
    [StringLength(50)]
    public string? SentReminderDays { get; set; }
    
    // --- 审计字段 ---
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // --- 辅助方法 ---
    
    /// <summary>
    /// 获取任务深度 (1 = 顶级)
    /// </summary>
    [NotMapped]
    public int Depth => Parent?.Depth + 1 ?? 1;
    
    /// <summary>
    /// 检查是否可以添加子任务 (最多 3 层)
    /// </summary>
    [NotMapped]
    public bool CanHaveChildren => Depth < 3;
}

