// ============================================================================
// Controllers/Admin/AdminStatsController.cs - 管理员统计 API 控制器
// ============================================================================
// 此控制器负责管理员仪表盘统计数据的 HTTP 接口。
//
// **架构重构**: 原 Controller 直接访问 DbContext 的逻辑已迁移到 StatsService，
//              现在遵循 Thin Controllers 原则，仅负责 HTTP IO。

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Mvc;           // ASP.NET Core MVC 核心类型
using Microsoft.AspNetCore.Authorization; // 授权特性
using MyNextBlog.Services;                // 业务服务层

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// `AdminStatsController` 是管理员仪表盘统计的 API 控制器。
/// 
/// **路由**: `/api/admin/stats`
/// **授权**: 仅限 Admin 角色访问
/// </summary>
[ApiController]
[Route("api/admin/stats")]
[Authorize(Roles = "Admin")]
public class AdminStatsController(IStatsService statsService) : ControllerBase
{
    /// <summary>
    /// 获取管理仪表盘统计数据
    /// </summary>
    /// <returns>包含文章、评论、分类、标签、系列统计的 DTO</returns>
    // `[HttpGet("dashboard")]`: 响应 GET /api/admin/stats/dashboard 请求
    [HttpGet("dashboard")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await statsService.GetAdminDashboardAsync();

        return Ok(new
        {
            success = true,
            data = stats
        });
    }
}
