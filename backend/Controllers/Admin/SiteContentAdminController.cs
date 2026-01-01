// ============================================================================
// Controllers/Admin/SiteContentAdminController.cs - 站点内容管理 API 控制器
// ============================================================================
// 此控制器负责站点配置的管理接口（仅管理员可访问）。
//
// **架构重构 (2026-01-01)**: 
//   - 移除 DbContext 直接注入
//   - 使用 ISiteContentService 处理业务逻辑

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Mvc;            // ASP.NET Core MVC
using Microsoft.AspNetCore.Authorization;  // 授权
using MyNextBlog.Services;                 // 业务服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// `SiteContentAdminController` 是站点内容配置管理的 API 控制器。
/// 
/// **路由**: `/api/admin/site-content`
/// **授权**: 仅限 Admin 角色访问
/// </summary>
[ApiController]
[Route("api/admin/site-content")]
[Authorize(Roles = "Admin")]
public class SiteContentAdminController(ISiteContentService siteContentService) : ControllerBase
{
    /// <summary>
    /// 获取所有配置项
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var contents = await siteContentService.GetAllAsync();
        return Ok(new { success = true, data = contents });
    }

    /// <summary>
    /// 获取单个配置项
    /// </summary>
    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key)
    {
        var content = await siteContentService.GetByKeyAsync(key);

        if (content == null)
        {
            return NotFound(new { success = false, message = "配置项不存在" });
        }

        return Ok(new { success = true, data = content });
    }

    /// <summary>
    /// 更新配置项
    /// </summary>
    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateContentRequest request)
    {
        var content = await siteContentService.UpdateValueAsync(key, request.Value);

        if (content == null)
        {
            return NotFound(new { success = false, message = "配置项不存在" });
        }

        return Ok(new
        {
            success = true,
            message = "更新成功",
            data = content
        });
    }

    /// <summary>
    /// 批量更新配置项
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> BatchUpdate([FromBody] BatchUpdateRequest request)
    {
        var updates = request.Updates.Select(u => (u.Key, u.Value)).ToList();
        var updatedCount = await siteContentService.BatchUpdateAsync(updates);

        return Ok(new
        {
            success = true,
            message = $"成功更新 {updatedCount} 个配置项",
            updatedCount
        });
    }
}

// DTO Models
public record UpdateContentRequest(string Value);

public record BatchUpdateRequest(List<ConfigUpdate> Updates);

public record ConfigUpdate(string Key, string Value);
