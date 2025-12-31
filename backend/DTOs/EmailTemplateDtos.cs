// ============================================================================
// DTOs/EmailTemplateDtos.cs - 邮件模板相关数据传输对象
// ============================================================================
// 此文件定义了邮件模板管理模块的 DTO。
//
// **DTO 用途**:
//   - `EmailTemplateDto`: 模板信息响应 (含可用占位符)
//   - `UpdateEmailTemplateDto`: 更新模板请求
//
// **占位符格式**: 使用 `{{PlaceholderName}}` 语法

// `namespace` 声明了当前文件中的代码所属的命名空间
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
