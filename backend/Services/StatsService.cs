// ============================================================================
// Services/StatsService.cs - 统计服务实现
// ============================================================================
// 此服务负责统计数据的查询和更新，原逻辑从 StatsController 和 
// AdminStatsController 迁移而来。
//
// **架构修复**: 将 DbContext 直接访问从 Controller 层移到 Service 层，
//              遵循 Clean Architecture (Thin Controllers)

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;  // EF Core 数据库操作
using MyNextBlog.Data;                // 数据访问层
using MyNextBlog.DTOs;                // 数据传输对象
using MyNextBlog.Models;              // 领域模型

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `StatsService` 是统计模块的核心服务类，实现 `IStatsService` 接口。
/// 
/// **主要功能**:
///   - `GetPublicStatsAsync`: 获取公开统计（首页 Pulse）
///   - `IncrementVisitCountAsync`: 记录访问量
///   - `GetAdminDashboardAsync`: 获取管理员仪表盘数据
/// 
/// **重构来源**:
///   - 原 `StatsController.Pulse()` → `GetPublicStatsAsync` + `IncrementVisitCountAsync`
///   - 原 `AdminStatsController.GetDashboardStats()` → `GetAdminDashboardAsync`
/// </summary>
public class StatsService(AppDbContext context) : IStatsService
{
    // 配置常量
    private const string VisitsKey = "sys_stats_visits";
    private const string LaunchDateKey = "site_launch_date";
    
    /// <summary>
    /// 记录一次访问（访问量 +1）
    /// </summary>
    /// <remarks>
    /// 使用 ExecuteSqlRawAsync 进行原子更新，避免并发问题。
    /// 如果 Key 不存在，则初始化为 1。
    /// </remarks>
    public async Task IncrementVisitCountAsync()
    {
        // 1. 尝试原子更新 (+1) 累计访问量
        var rowsAffected = await context.Database.ExecuteSqlRawAsync(
            "UPDATE \"SiteContents\" SET \"Value\" = CAST(CAST(\"Value\" AS INTEGER) + 1 AS TEXT), \"UpdatedAt\" = {0} WHERE \"Key\" = {1}",
            DateTime.UtcNow,
            VisitsKey
        );

        if (rowsAffected == 0)
        {
            // 2. 如果 Key 不存在，则初始化
            if (!await context.SiteContents.AnyAsync(s => s.Key == VisitsKey))
            {
                context.SiteContents.Add(new SiteContent
                {
                    Key = VisitsKey,
                    Value = "1",
                    Description = "System Total Visits (Auto-increment)"
                });
                try 
                {
                    await context.SaveChangesAsync();
                }
                catch
                {
                    // 并发插入冲突，忽略（下次请求会正常更新）
                }
            }
        }
    }
    
    /// <summary>
    /// 获取公开统计数据（用于首页 Pulse 组件）
    /// </summary>
    public async Task<SiteStatsDto> GetPublicStatsAsync()
    {
        // 1. 获取访问量
        var visitsContent = await context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == VisitsKey);
        var visits = int.TryParse(visitsContent?.Value, out var v) ? v : 0;
        
        // 2. 获取公开文章数（排除隐藏和软删除）
        var postsCount = await context.Posts
            .AsNoTracking()
            .Where(p => !p.IsHidden && !p.IsDeleted)
            .CountAsync();
        
        // 3. 获取评论总数
        var commentsCount = await context.Comments
            .AsNoTracking()
            .CountAsync();
        
        // 4. 计算运行天数
        var launchDateContent = await context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == LaunchDateKey);
        
        var launchDate = DateTime.TryParse(launchDateContent?.Value, out var parsed) 
            ? parsed 
            : new DateTime(2025, 12, 1);  // 默认日期
        
        var runningDays = (int)(DateTime.UtcNow - launchDate).TotalDays;
        
        return new SiteStatsDto(visits, postsCount, commentsCount, runningDays);
    }
    
    /// <summary>
    /// 获取管理员仪表盘统计数据
    /// </summary>
    public async Task<AdminDashboardDto> GetAdminDashboardAsync()
    {
        // 1. 文章统计（排除软删除）
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

        // 2. 评论统计
        var totalComments = await context.Comments
            .AsNoTracking()
            .CountAsync();

        // 3. 分类和标签统计
        var totalCategories = await context.Categories
            .AsNoTracking()
            .CountAsync();

        var totalTags = await context.Tags
            .AsNoTracking()
            .CountAsync();

        // 4. 系列统计
        var totalSeries = await context.Series
            .AsNoTracking()
            .CountAsync();

        return new AdminDashboardDto(
            new PostStatsDto(totalPosts, publishedPosts, draftPosts),
            totalComments,
            totalCategories,
            totalTags,
            totalSeries
        );
    }
}
