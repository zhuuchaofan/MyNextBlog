// ============================================================================
// DTOs/TodoDtos.cs - 待办事项相关的数据传输对象
// ============================================================================
// 用于 API 请求/响应的数据结构和输入验证。
//
// **DTO 分类**:
//   - 输出 DTO: TodoTaskDto (API 响应，支持嵌套子任务)
//   - 输入 DTO: CreateTodoDto, UpdateTodoDto (API 请求，带验证)
//   - 拖拽 DTO: MoveTodoDto, BatchUpdateTodoSortDto

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

// ========== 输出 DTO ==========

/// <summary>
/// 待办任务返回的 DTO (支持层级嵌套)
/// </summary>
public record TodoTaskDto(
    int Id,
    string Title,
    string? Description,
    string TaskType,          // epic/story/task
    string Stage,
    string Priority,
    int SortOrder,
    DateTime? StartDate,
    DateTime? DueDate,
    int? ParentId,            // 父任务 ID
    bool ReminderEnabled,
    string ReminderDays,      // "7,3,1,0"
    string? SentReminderDays, // 已发送的提醒天数
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<TodoTaskDto>? Children = null  // 子任务列表 (可选)
);

// ========== 输入 DTO ==========

/// <summary>
/// 创建待办任务请求
/// </summary>
public record CreateTodoDto(
    [Required(ErrorMessage = "标题不能为空")]
    [StringLength(100, ErrorMessage = "标题不能超过100个字符")]
    string Title,
    
    [StringLength(500, ErrorMessage = "描述不能超过500个字符")]
    string? Description = null,
    
    string TaskType = "task",  // epic/story/task
    string Stage = "todo",
    string Priority = "medium",
    
    int? ParentId = null,      // 父任务 ID
    
    DateTime? StartDate = null,
    DateTime? DueDate = null,
    
    bool ReminderEnabled = false,
    string ReminderDays = "7,3,1,0"
);

/// <summary>
/// 更新待办任务请求
/// </summary>
public record UpdateTodoDto(
    [StringLength(100, ErrorMessage = "标题不能超过100个字符")]
    string? Title = null,
    
    [StringLength(500, ErrorMessage = "描述不能超过500个字符")]
    string? Description = null,
    
    string? TaskType = null,
    string? Stage = null,
    string? Priority = null,
    
    DateTime? StartDate = null,
    DateTime? DueDate = null,
    
    bool? ReminderEnabled = null,
    string? ReminderDays = null
);

// ========== 拖拽操作 DTO ==========

/// <summary>
/// 移动任务到新阶段
/// </summary>
public record MoveTodoDto(
    [Required] string NewStage,
    int NewSortOrder
);

/// <summary>
/// 批量更新任务排序
/// </summary>
public record BatchUpdateTodoSortDto(
    List<TodoSortItem> Items
);

/// <summary>
/// 单个任务排序项
/// </summary>
public record TodoSortItem(
    int Id,
    string Stage,
    int SortOrder
);
