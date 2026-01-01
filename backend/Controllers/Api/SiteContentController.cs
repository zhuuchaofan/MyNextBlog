// ============================================================================
// Controllers/Api/SiteContentController.cs - 站点内容配置 API 控制器
// ============================================================================
// 此控制器负责站点配置的 HTTP 接口。
//
// **架构重构**: 原 Controller 直接访问 DbContext 的逻辑已迁移到 SiteContentService，
//              现在遵循 Thin Controllers 原则，仅负责 HTTP IO。

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Authorization;  // 授权特性
using Microsoft.AspNetCore.Mvc;            // ASP.NET Core MVC 核心类型
using MyNextBlog.Services;                 // 业务服务层

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `SiteContentController` 是站点内容配置的 API 控制器。
/// 
/// **路由**: `/api/site-content`
/// **职责**: 提供站点配置的 CRUD 接口
/// </summary>
[ApiController]
[Route("api/site-content")]
public class SiteContentController(ISiteContentService siteContentService) : ControllerBase
{
    /// <summary>
    /// 获取指定 Key 的内容（公开接口）
    /// </summary>
    /// <param name="key">配置键</param>
    /// <returns>配置详情</returns>
    // `[HttpGet("{key}")]`: 响应 GET /api/site-content/{key} 请求
    [HttpGet("{key}")]
    public async Task<IActionResult> GetContent(string key)
    {
        var content = await siteContentService.GetByKeyAsync(key);

        if (content == null)
        {
            return NotFound(new { success = false, message = $"未找到内容: {key}" });
        }

        return Ok(new { success = true, data = content });
    }

    /// <summary>
    /// 获取所有内容配置（管理员接口）
    /// </summary>
    /// <returns>所有配置列表</returns>
    // `[HttpGet]`: 响应 GET /api/site-content 请求
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllContent()
    {
        var contents = await siteContentService.GetAllAsync();
        return Ok(new { success = true, data = contents });
    }

    /// <summary>
    /// 更新或创建内容配置（管理员接口）
    /// </summary>
    /// <param name="key">配置键</param>
    /// <param name="dto">更新数据</param>
    /// <returns>更新后的配置</returns>
    // `[HttpPut("{key}")]`: 响应 PUT /api/site-content/{key} 请求
    [HttpPut("{key}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateContent(string key, [FromBody] UpdateContentDto dto)
    {
        var content = await siteContentService.UpsertAsync(key, dto.Value, dto.Description);

        return Ok(new { 
            success = true, 
            message = "内容已更新",
            data = content
        });
    }
}

/// <summary>
/// 更新内容的请求 DTO
/// </summary>
public record UpdateContentDto(string Value, string? Description);
