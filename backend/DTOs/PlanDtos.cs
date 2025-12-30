// DTOs/PlanDtos.cs
// 计划功能相关的数据传输对象

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

// ========== Plan DTOs ==========

/// <summary>
/// 计划列表返回的 DTO
/// </summary>
public record PlanListDto(
    int Id,
    string Title,
    string Type,
    string StartDate,
    string? EndDate,
    decimal Budget,
    decimal ActualCost,
    string Currency,
    string Status,
    bool IsSecret,
    int? AnniversaryId,
    string? AnniversaryTitle,
    int DaysCount,              // 行程天数
    DateTime CreatedAt
);

/// <summary>
/// 计划详情返回的 DTO（含完整日程）
/// </summary>
public record PlanDetailDto(
    int Id,
    string Title,
    string? Description,
    string Type,
    string StartDate,
    string? EndDate,
    decimal Budget,
    decimal ActualCost,
    string Currency,
    string Status,
    bool IsSecret,
    bool EnableReminder,
    string? ReminderEmail,
    string ReminderDays,
    int? AnniversaryId,
    string? AnniversaryTitle,
    List<PlanDayDto> Days,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// 创建计划请求
/// </summary>
public record CreatePlanDto(
    [Required(ErrorMessage = "标题不能为空")]
    [StringLength(50, ErrorMessage = "标题不能超过50个字符")]
    string Title,
    
    [StringLength(200, ErrorMessage = "描述不能超过200个字符")]
    string? Description,
    
    string Type,
    string StartDate,
    string? EndDate,
    decimal Budget = 0,
    string Currency = "CNY",
    bool IsSecret = false,
    bool EnableReminder = false,
    string? ReminderEmail = null,
    string ReminderDays = "7,3,1,0",
    int? AnniversaryId = null
);

/// <summary>
/// 更新计划请求
/// </summary>
public record UpdatePlanDto(
    [StringLength(50, ErrorMessage = "标题不能超过50个字符")]
    string? Title,
    
    [StringLength(200, ErrorMessage = "描述不能超过200个字符")]
    string? Description,
    
    string? Type,
    string? StartDate,
    string? EndDate,
    decimal? Budget,
    decimal? ActualCost,
    string? Currency,
    string? Status,
    bool? IsSecret,
    bool? EnableReminder,
    string? ReminderEmail,
    string? ReminderDays,
    int? AnniversaryId
);

// ========== PlanDay DTOs ==========

/// <summary>
/// 每日行程 DTO
/// </summary>
public record PlanDayDto(
    int Id,
    int DayNumber,
    string Date,
    string? Theme,
    List<PlanActivityDto> Activities
);

/// <summary>
/// 创建/更新每日行程请求
/// </summary>
public record CreatePlanDayDto(
    int DayNumber,
    string Date,
    
    [StringLength(50, ErrorMessage = "主题不能超过50个字符")]
    string? Theme
);

public record UpdatePlanDayDto(
    int? DayNumber,
    string? Date,
    
    [StringLength(50, ErrorMessage = "主题不能超过50个字符")]
    string? Theme
);

// ========== PlanActivity DTOs ==========

/// <summary>
/// 活动项 DTO
/// </summary>
public record PlanActivityDto(
    int Id,
    string? Time,
    string Title,
    string? Location,
    string? Notes,
    decimal EstimatedCost,
    decimal ActualCost,
    int SortOrder
);

/// <summary>
/// 创建活动请求
/// </summary>
public record CreateActivityDto(
    [StringLength(5, ErrorMessage = "时间格式错误")]
    string? Time,
    
    [Required(ErrorMessage = "活动名称不能为空")]
    [StringLength(50, ErrorMessage = "活动名称不能超过50个字符")]
    string Title,
    
    [StringLength(50, ErrorMessage = "地点不能超过50个字符")]
    string? Location,
    
    [StringLength(200, ErrorMessage = "备注不能超过200个字符")]
    string? Notes,
    
    decimal EstimatedCost = 0,
    int SortOrder = 0
);

/// <summary>
/// 更新活动请求
/// </summary>
public record UpdateActivityDto(
    [StringLength(5, ErrorMessage = "时间格式错误")]
    string? Time,
    
    [StringLength(50, ErrorMessage = "活动名称不能超过50个字符")]
    string? Title,
    
    [StringLength(50, ErrorMessage = "地点不能超过50个字符")]
    string? Location,
    
    [StringLength(200, ErrorMessage = "备注不能超过200个字符")]
    string? Notes,
    
    decimal? EstimatedCost,
    decimal? ActualCost,
    int? SortOrder
);

// ========== Batch Update DTOs ==========

/// <summary>
/// 批量更新活动排序请求中的单个项
/// </summary>
public record ActivitySortItem(int Id, int SortOrder);

/// <summary>
/// 批量更新活动排序请求
/// </summary>
public record BatchUpdateActivitySortDto(List<ActivitySortItem> Items);

// ========== Public (No Auth) DTOs ==========

/// <summary>
/// 公开预览的计划详情（隐藏敏感信息）
/// </summary>
public record PublicPlanDetailDto(
    int Id,
    string Title,
    string? Description,
    string Type,
    string StartDate,
    string? EndDate,
    string Status,
    List<PublicPlanDayDto> Days
);

/// <summary>
/// 公开预览的日程
/// </summary>
public record PublicPlanDayDto(
    int Id,
    int DayNumber,
    string Date,
    string? Theme,
    List<PublicActivityDto> Activities
);

/// <summary>
/// 公开预览的活动（隐藏预算）
/// </summary>
public record PublicActivityDto(
    int Id,
    string? Time,
    string Title,
    string? Location,
    string? Notes,
    int SortOrder
);
