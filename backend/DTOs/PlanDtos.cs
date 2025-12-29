// DTOs/PlanDtos.cs
// 计划功能相关的数据传输对象

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
    string Title,
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
    string? Title,
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
    string? Theme
);

public record UpdatePlanDayDto(
    int? DayNumber,
    string? Date,
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
    string? Time,
    string Title,
    string? Location,
    string? Notes,
    decimal EstimatedCost = 0,
    int SortOrder = 0
);

/// <summary>
/// 更新活动请求
/// </summary>
public record UpdateActivityDto(
    string? Time,
    string? Title,
    string? Location,
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
