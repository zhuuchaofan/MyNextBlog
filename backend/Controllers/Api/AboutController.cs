// ============================================================================
// Controllers/Api/AboutController.cs - 关于页面数据聚合 API 控制器
// ============================================================================
// 此控制器将关于页面所需的多个 SiteContent 请求合并为单个端点。
//
// **设计目的**: 减少网络开销，原来需要 9 个请求，现在只需 1 个
// **数据内容**: about_intro, about_author, about_skills, about_timeline,
//              about_books, about_gears, about_pets, about_thanks_*

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using Microsoft.Extensions.Logging;

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
    AppDbContext context,
    ILogger<AboutController> logger) : ControllerBase
{
    /// <summary>
    /// 获取关于页面所需的所有配置数据（聚合接口）
    /// 替代原来的 9 个独立请求
    /// </summary>
    [HttpGet("initial-data")]
    public async Task<IActionResult> GetInitialData()
    {
        logger.LogInformation("Fetching about page initial data (aggregated)");

        try
        {
            // 定义关于页面所需的所有配置键
            var aboutKeys = new[]
            {
                "about_intro",
                "about_author",
                "about_skills",
                "about_timeline",
                "about_books",
                "about_gears",
                "about_pets",
                "about_thanks_title",
                "about_thanks_content"
            };

            // 批量查询所有配置
            var contents = await context.SiteContents
                .AsNoTracking()
                .Where(c => aboutKeys.Contains(c.Key))
                .Select(c => new { c.Key, c.Value })
                .ToListAsync();

            // 转换为字典，方便前端按 key 取值
            var contentDict = contents.ToDictionary(c => c.Key, c => c.Value);

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
