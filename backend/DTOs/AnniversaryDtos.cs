// DTOs/AnniversaryDtos.cs
// 纪念日相关的数据传输对象

namespace MyNextBlog.DTOs;

/// <summary>
/// 公开查询返回的纪念日 DTO（纯数据，不含判断逻辑）
/// 注意：IsTodayAnniversary 由前端根据用户本地时间判断
/// </summary>
public record AnniversaryDto(
    int Id,
    string Title,
    string Emoji,
    string StartDate,       // "2024-06-01" 格式
    string RepeatType,
    string DisplayType,     // "duration" | "age"
    int DaysSinceStart     // 基于 UTC 计算的已过天数（仅供参考）
);

/// <summary>
/// 管理后台返回的完整纪念日信息
/// </summary>
public record AnniversaryAdminDto(
    int Id,
    string Title,
    string Emoji,
    string StartDate,
    string RepeatType,
    string DisplayType,     // "duration" | "age"
    bool IsActive,
    int DisplayOrder,
    int DaysSinceStart,     // 已过天数
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// 创建/更新纪念日请求
/// </summary>
public record CreateAnniversaryDto(
    string Title,
    string Emoji,
    string StartDate,       // "2024-06-01" 格式
    string RepeatType,
    string DisplayType      // "duration" | "age"
);

/// <summary>
/// 更新纪念日请求（含可选的启用状态和排序）
/// </summary>
public record UpdateAnniversaryDto(
    string Title,
    string Emoji,
    string StartDate,
    string RepeatType,
    string DisplayType,
    bool? IsActive,
    int? DisplayOrder
);

