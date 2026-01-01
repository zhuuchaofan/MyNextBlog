// ============================================================================
// Controllers/Api/AboutController.cs - 关于页面数据聚合 API 控制器
// ============================================================================
// 此控制器将关于页面所需的多个 SiteContent 请求合并为单个端点。
//
// **设计目的**: 减少网络开销，原来需要 9 个请求，现在只需 1 个
// **架构重构**: 原 Controller 直接访问 DbContext 的逻辑已迁移到 SiteContentService，
//              现在遵循 Thin Controllers 原则，仅负责 HTTP IO。

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Mvc;      // ASP.NET Core MVC 核心类型
using Microsoft.Extensions.Logging;  // 日志
using MyNextBlog.Services;           // 业务服务层

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `AboutController` 是关于页面数据聚合的 API 控制器。
/// 
/// **路由**: `/api/about`
/// **主要接口**: GET initial-data (聚合关于页面所有配置)
/// </summary>
[ApiController]
[Route("api/about")]
public class AboutController(
    ISiteContentService siteContentService,
    ILogger<AboutController> logger) : ControllerBase
{
    /// <summary>
    /// 获取关于页面所需的所有配置数据（聚合接口）
    /// 替代原来的 9 个独立请求
    /// </summary>
    /// <returns>配置数据字典</returns>
    // `[HttpGet("initial-data")]`: 响应 GET /api/about/initial-data 请求
    [HttpGet("initial-data")]
    public async Task<IActionResult> GetInitialData()
    {
        logger.LogInformation("Fetching about page initial data (aggregated)");

        try
        {
            var contentDict = await siteContentService.GetAboutPageDataAsync();

            return Ok(new
            {
                success = true,
                data = contentDict
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching about page initial data");
            return StatusCode(500, new
            {
                success = false,
                message = "获取关于页面数据失败"
            });
        }
    }
}
