// Controllers/Admin/EmailTemplatesController.cs
// 邮件模板管理 API

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// 邮件模板管理 API
/// 仅管理员可访问
/// </summary>
[Route("api/admin/email-templates")]
[ApiController]
[Authorize(Roles = "Admin")]
public class EmailTemplatesController(IEmailTemplateService templateService) : ControllerBase
{
    /// <summary>
    /// 获取所有邮件模板
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var templates = await templateService.GetAllAsync();
        return Ok(new { success = true, data = templates });
    }
    
    /// <summary>
    /// 根据 Key 获取单个模板
    /// </summary>
    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key)
    {
        var template = await templateService.GetByKeyAsync(key);
        if (template == null)
            return NotFound(new { success = false, message = $"模板 '{key}' 不存在" });
        
        return Ok(new { success = true, data = template });
    }
    
    /// <summary>
    /// 更新模板内容
    /// </summary>
    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateEmailTemplateDto dto)
    {
        var result = await templateService.UpdateAsync(key, dto);
        if (!result)
            return NotFound(new { success = false, message = $"模板 '{key}' 不存在" });
        
        return Ok(new { success = true, message = "更新成功" });
    }
}
