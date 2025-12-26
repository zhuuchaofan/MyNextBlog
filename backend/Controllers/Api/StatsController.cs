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
    // 用于前端组件的心跳/计数
    [HttpPost("pulse")]
    public async Task<IActionResult> Pulse()
    {
        const string key = "sys_stats_visits";
        
        // 1. 尝试原子更新 (+1)
        // 使用通用 SQL (SQLite/Postgres 兼容 CAST)
        // 注意：UpdatedAt 即使是 Update 语句也需要更新
        var rowsAffected = await context.Database.ExecuteSqlRawAsync(
            "UPDATE \"SiteContents\" SET \"Value\" = CAST(CAST(\"Value\" AS INTEGER) + 1 AS TEXT), \"UpdatedAt\" = {0} WHERE \"Key\" = {1}",
            DateTime.UtcNow,
            key
        );

        if (rowsAffected == 0)
        {
            // 2. 如果 Key 不存在，则初始化
            // 为了防止并发插入导致的异常，使用 try-catch 或简单的检查
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
                    return Ok(new { visits = 1 });
                }
                catch
                {
                    // 并发插入冲突，忽略，假装成功（下一次请求会修正）
                }
            }
            
            // 重新查询最新值
        }

        // 3. 返回最新计数 (脏读即可，无需事务强一致)
        // 使用 AsNoTracking 减少开销
        var content = await context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key);

        // 如果还是空的(极端情况)，返回 1
        var visits = content?.Value ?? "1";
        
        return Ok(new { visits = int.Parse(visits) });
    }
}
