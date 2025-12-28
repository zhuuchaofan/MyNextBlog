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
            // 1. 并行获取文章和标签
            var postsTask = postService.GetAllPostsAsync(page, pageSize, includeHidden);
            var tagsTask = tagService.GetPopularTagsAsync(10, includeHidden: false); // 获取前 10 个热门标签

            // 2. 批量获取 SiteContent（单次查询获取所有配置）
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

            var siteContentsTask = context.SiteContents
                .AsNoTracking()
                .Where(c => siteContentKeys.Contains(c.Key))
                .Select(c => new { c.Key, c.Value })
                .ToListAsync();

            // 3. 等待所有任务完成
            await Task.WhenAll(postsTask, tagsTask, siteContentsTask);

            var (posts, totalCount) = await postsTask;
            var tags = await tagsTask;
            var siteContents = await siteContentsTask;

            // 4. 将 SiteContent 转换为字典，方便前端使用
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
                    tags,
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
