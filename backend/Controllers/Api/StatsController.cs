using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Controllers.Api;

[ApiController]
[Route("api/stats")]
public class StatsController(AppDbContext context) : ControllerBase
{
    // POST /api/stats/pulse
    // 用于前端组件的心跳/计数，返回多项统计数据
    [HttpPost("pulse")]
    public async Task<IActionResult> Pulse()
    {
        const string key = "sys_stats_visits";
        
        // 1. 尝试原子更新 (+1) 累计访问量
        var rowsAffected = await context.Database.ExecuteSqlRawAsync(
            "UPDATE \"SiteContents\" SET \"Value\" = CAST(CAST(\"Value\" AS INTEGER) + 1 AS TEXT), \"UpdatedAt\" = {0} WHERE \"Key\" = {1}",
            DateTime.UtcNow,
            key
        );

        if (rowsAffected == 0)
        {
            // 2. 如果 Key 不存在，则初始化
            if (!await context.SiteContents.AnyAsync(s => s.Key == key))
            {
                context.SiteContents.Add(new SiteContent
                {
                    Key = key,
                    Value = "1",
                    Description = "System Total Visits (Auto-increment)"
                });
                try 
                {
                    await context.SaveChangesAsync();
                }
                catch
                {
                    // 并发插入冲突，忽略
                }
            }
        }

        // 3. 获取最新访问量
        var content = await context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key);
        var visits = content?.Value ?? "1";
        
        // 4. 获取额外统计数据（真实数据）
        // 文章总数（仅公开文章）
        var postsCount = await context.Posts
            .AsNoTracking()
            .Where(p => !p.IsHidden)
            .CountAsync();
        
        // 评论总数
        var commentsCount = await context.Comments
            .AsNoTracking()
            .CountAsync();
        
        // 运行天数（从配置读取起始日期，默认从 2025-01-01 开始）
        var launchDateContent = await context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == "site_launch_date");
        
        var launchDate = DateTime.TryParse(launchDateContent?.Value, out var parsed) 
            ? parsed 
            : new DateTime(2025, 1, 1);
        
        var runningDays = (int)(DateTime.UtcNow - launchDate).TotalDays;
        
        return Ok(new { 
            visits = int.Parse(visits),
            postsCount,
            commentsCount,
            runningDays
        });
    }
}
