using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Services;
using Microsoft.Extensions.Logging;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 首页数据聚合 API
/// 将多个独立请求合并为单个端点，减少网络开销
/// </summary>
[ApiController]
[Route("api/home")]
public class HomeController(
    AppDbContext context,
    IPostService postService,
    ITagService tagService,
    ILogger<HomeController> logger) : ControllerBase
{
    /// <summary>
    /// 获取首页所需的所有初始数据（聚合接口）
    /// 替代原来的 12 个独立请求
    /// </summary>
    [HttpGet("initial-data")]
    public async Task<IActionResult> GetInitialData(
        [FromQuery] bool includeHidden = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        logger.LogInformation("Fetching home page initial data (aggregated)");

        try
        {
            // 1. 串行获取文章和标签
            // ⚠️ 不能使用 Task.WhenAll 并行执行！
            // 原因：PostService 和 TagService 共享同一个 Scoped 的 DbContext 实例，
            // 而 EF Core 的 DbContext 不是线程安全的，并行访问会导致：
            // "A second operation was started on this context instance before a previous operation completed"
            var (posts, totalCount) = await postService.GetAllPostsAsync(page, pageSize, includeHidden);
            var tags = await tagService.GetPopularTagsAsync(10, includeHidden: false);

            // 2. 批量获取 SiteContent（独立查询，避免并发冲突）
            var siteContentKeys = new[]
            {
                "homepage_intro",
                "about_author",
                "about_pets",
                "homepage_slogan",
                "homepage_title_suffix",
                "homepage_cta_primary",
                "homepage_cta_secondary",
                "stats_system_status",
                "stats_total_visits",
                "stats_server_time"
            };

            var siteContents = await context.SiteContents
                .AsNoTracking()
                .Where(c => siteContentKeys.Contains(c.Key))
                .Select(c => new { c.Key, c.Value })
                .ToListAsync();

            // 3. 将 SiteContent 转换为字典，方便前端使用
            var contentDict = siteContents.ToDictionary(c => c.Key, c => c.Value);

            return Ok(new
            {
                success = true,
                data = new
                {
                    posts = new
                    {
                        data = posts,
                        meta = new
                        {
                            hasMore = (page * pageSize) < totalCount,
                            totalCount
                        }
                    },
                    tags = tags.Select(t => t.Name).ToList(), // 仅返回标签名称，与前端期望格式一致
                    content = contentDict
                }
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching home page initial data");
            return StatusCode(500, new
            {
                success = false,
                message = "获取首页数据失败"
            });
        }
    }
}
