// Models/EmailTemplate.cs
// 邮件模板实体模型，用于存储可配置的邮件模板

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Models;

/// <summary>
/// 邮件模板实体
/// 支持通过后台 UI 编辑邮件内容，无需修改代码
/// </summary>
public class EmailTemplate
{
    public int Id { get; set; }
    
    /// <summary>
    /// 模板标识符，如 "new_comment", "anniversary_reminder"
    /// 用于代码中查找对应模板
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string TemplateKey { get; set; } = string.Empty;
    
    /// <summary>
    /// 模板名称（用于后台显示）
    /// 如 "新评论通知", "纪念日提醒"
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 邮件主题模板，支持占位符如 {{PostTitle}}
    /// </summary>
    [Required]
    public string SubjectTemplate { get; set; } = string.Empty;
    
    /// <summary>
    /// 邮件正文 HTML 模板
    /// </summary>
    [Required]
    public string BodyTemplate { get; set; } = string.Empty;
    
    /// <summary>
    /// 可用占位符说明（JSON 格式）
    /// 如: {"PostTitle": "文章标题", "GuestName": "评论者名称"}
    /// </summary>
    public string? AvailablePlaceholders { get; set; }
    
    /// <summary>
    /// 模板用途描述（展示给用户）
    /// 如: "当文章收到新评论时，发送邮件给站长"
    /// </summary>
    [MaxLength(200)]
    public string? Description { get; set; }
    
    /// <summary>
    /// 是否启用（用于临时禁用某类邮件）
    /// </summary>
    public bool IsEnabled { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
