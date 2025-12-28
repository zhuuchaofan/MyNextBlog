// Services/IEmailTemplateService.cs
// 邮件模板服务接口

using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

/// <summary>
/// 邮件模板服务接口
/// </summary>
public interface IEmailTemplateService
{
    /// <summary>
    /// 获取所有邮件模板（管理后台用）
    /// </summary>
    Task<List<EmailTemplateDto>> GetAllAsync();
    
    /// <summary>
    /// 根据 Key 获取单个模板
    /// </summary>
    Task<EmailTemplateDto?> GetByKeyAsync(string templateKey);
    
    /// <summary>
    /// 更新模板内容
    /// </summary>
    Task<bool> UpdateAsync(string templateKey, UpdateEmailTemplateDto dto);
    
    /// <summary>
    /// 渲染模板（替换占位符）
    /// </summary>
    /// <param name="templateKey">模板标识符</param>
    /// <param name="data">占位符数据</param>
    /// <returns>渲染后的 (Subject, Body) 元组，如果模板不存在或被禁用则返回 null</returns>
    Task<(string Subject, string Body)?> RenderAsync(string templateKey, Dictionary<string, string> data);
}
