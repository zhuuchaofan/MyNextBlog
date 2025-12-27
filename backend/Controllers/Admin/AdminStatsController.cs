using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;

namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// 管理员仪表盘统计 API
/// </summary>
[ApiController]
[Route("api/admin/stats")]
[Authorize(Roles = "Admin")]
public class AdminStatsController(AppDbContext context) : ControllerBase
{
    /// <summary>
    /// 获取管理仪表盘统计数据
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        // 文章统计（排除软删除）
        var totalPosts = await context.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted)
            .CountAsync();

        var publishedPosts = await context.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted && !p.IsHidden)
            .CountAsync();

        var draftPosts = await context.Posts
            .AsNoTracking()
            .Where(p => !p.IsDeleted && p.IsHidden)
            .CountAsync();

        // 评论统计
        var totalComments = await context.Comments
            .AsNoTracking()
            .CountAsync();

        // 分类和标签统计
        var totalCategories = await context.Categories
            .AsNoTracking()
            .CountAsync();

        var totalTags = await context.Tags
            .AsNoTracking()
            .CountAsync();

        // 系列统计
        var totalSeries = await context.Series
            .AsNoTracking()
            .CountAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                posts = new
                {
                    total = totalPosts,
                    published = publishedPosts,
                    draft = draftPosts
                },
                comments = totalComments,
                categories = totalCategories,
                tags = totalTags,
                series = totalSeries
            }
        });
    }
}
