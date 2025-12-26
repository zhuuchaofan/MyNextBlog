namespace MyNextBlog.Models;

/// <summary>
/// 站点内容配置实体
/// 用于存储可动态配置的页面内容（如主页介绍、关于我介绍等）
/// </summary>
public class SiteContent
{
    public int Id { get; set; }
    
    /// <summary>
    /// 内容键名，如 "homepage_intro", "about_intro"
    /// </summary>
    public string Key { get; set; } = string.Empty;
    
    /// <summary>
    /// 内容值，支持 HTML 或纯文本
    /// </summary>
    public string Value { get; set; } = string.Empty;
    
    /// <summary>
    /// 内容描述，用于后台管理界面显示
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// 最后更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
