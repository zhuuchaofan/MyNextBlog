// ============================================================================
// Controllers/Api/StatsController.cs - 公开统计 API 控制器
// ============================================================================
// 此控制器负责公开统计数据的 HTTP 接口。
//
// **架构重构**: 原 Controller 直接访问 DbContext 的逻辑已迁移到 StatsService，
//              现在遵循 Thin Controllers 原则，仅负责 HTTP IO。

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Mvc;  // ASP.NET Core MVC 核心类型
using MyNextBlog.Services;       // 业务服务层

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `StatsController` 是公开统计的 API 控制器。
/// 
/// **路由**: `/api/stats`
/// **职责**: 提供首页 Pulse 组件所需的统计数据
/// </summary>
[ApiController]
[Route("api/stats")]
public class StatsController(IStatsService statsService) : ControllerBase
{
    /// <summary>
    /// 心跳接口：记录访问并返回统计数据
    /// </summary>
    /// <remarks>
    /// 每次调用会：
    ///   1. 访问量 +1
    ///   2. 返回最新的统计数据（访问量、文章数、评论数、运行天数）
    /// </remarks>
    /// <returns>统计数据 DTO</returns>
    // `[HttpPost("pulse")]`: 响应 POST /api/stats/pulse 请求
    [HttpPost("pulse")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Pulse()
    {
        // 1. 记录访问量
        await statsService.IncrementVisitCountAsync();
        
        // 2. 获取并返回统计数据
        var stats = await statsService.GetPublicStatsAsync();
        
        // 符合 GEMINI.md 3.2 API 响应格式规范
        return Ok(new { success = true, data = stats });
    }
}
