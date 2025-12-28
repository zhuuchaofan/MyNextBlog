// DTOs/EmailTemplateDtos.cs
// 邮件模板相关的数据传输对象

namespace MyNextBlog.DTOs;

/// <summary>
/// 邮件模板 DTO（返回给前端）
/// </summary>
public record EmailTemplateDto(
    int Id,
    string TemplateKey,
    string Name,
    string SubjectTemplate,
    string BodyTemplate,
    string? AvailablePlaceholders,
    string? Description,
    bool IsEnabled,
    DateTime UpdatedAt
);

/// <summary>
/// 更新邮件模板请求 DTO
/// </summary>
public record UpdateEmailTemplateDto(
    string SubjectTemplate,
    string BodyTemplate,
    bool? IsEnabled
);
