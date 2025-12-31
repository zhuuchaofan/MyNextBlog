// ============================================================================
// DTOs/AnniversaryDtos.cs - 纪念日相关数据传输对象
// ============================================================================
// 此文件定义了纪念日模块的 DTO，用于公开展示和管理后台。
//
// **DTO 分类**:
//   - 公开 DTO: `AnniversaryDto` (不含敏感信息)
//   - 管理 DTO: `AnniversaryAdminDto` (包含提醒配置)
//   - 输入 DTO: `CreateAnniversaryDto`, `UpdateAnniversaryDto`
//
// **日期说明**: StartDate 使用 "yyyy-MM-dd" 字符串格式

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解，用于输入验证

// `namespace` 声明了当前文件中的代码所属的命名空间
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
    // 邮件提醒配置
    bool EnableReminder,
    string? ReminderEmail,
    string ReminderDays,    // "30,15,7,1,0"
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// 创建纪念日请求
/// </summary>
public record CreateAnniversaryDto(
    [Required(ErrorMessage = "标题不能为空")]
    [StringLength(30, ErrorMessage = "标题不能超过30个字符")]
    string Title,
    
    [StringLength(10, ErrorMessage = "Emoji不能超过10个字符")]
    string Emoji,
    
    string StartDate,       // "2024-06-01" 格式
    string RepeatType,
    string DisplayType,     // "duration" | "age"
    // 邮件提醒配置
    bool EnableReminder = false,
    string? ReminderEmail = null,
    string ReminderDays = "7,1,0"
);

/// <summary>
/// 更新纪念日请求（含可选字段）
/// </summary>
public record UpdateAnniversaryDto(
    [Required(ErrorMessage = "标题不能为空")]
    [StringLength(30, ErrorMessage = "标题不能超过30个字符")]
    string Title,
    
    [StringLength(10, ErrorMessage = "Emoji不能超过10个字符")]
    string Emoji,
    
    string StartDate,
    string RepeatType,
    string DisplayType,
    bool? IsActive,
    int? DisplayOrder,
    // 邮件提醒配置
    bool? EnableReminder,
    string? ReminderEmail,
    string? ReminderDays
);
