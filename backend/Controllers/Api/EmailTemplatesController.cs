// Controllers/Api/EmailTemplatesController.cs
// 邮件模板管理 API

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 邮件模板管理 API
/// 仅管理员可访问
/// </summary>
[Route("api/email-templates")]
[ApiController]
[Authorize(Roles = "Admin")]
public class EmailTemplatesController(IEmailTemplateService templateService) : ControllerBase
{
    /// <summary>
    /// 获取所有邮件模板
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<EmailTemplateDto>>> GetAll()
    {
        var templates = await templateService.GetAllAsync();
        return Ok(templates);
    }
    
    /// <summary>
    /// 根据 Key 获取单个模板
    /// </summary>
    [HttpGet("{key}")]
    public async Task<ActionResult<EmailTemplateDto>> GetByKey(string key)
    {
        var template = await templateService.GetByKeyAsync(key);
        if (template == null)
            return NotFound(new { message = $"模板 '{key}' 不存在" });
        
        return Ok(template);
    }
    
    /// <summary>
    /// 更新模板内容
    /// </summary>
    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateEmailTemplateDto dto)
    {
        var success = await templateService.UpdateAsync(key, dto);
        if (!success)
            return NotFound(new { message = $"模板 '{key}' 不存在" });
        
        return Ok(new { message = "更新成功" });
    }
}
