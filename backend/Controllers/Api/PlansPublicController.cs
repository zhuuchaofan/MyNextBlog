// Controllers/Api/PlansPublicController.cs
// 计划公开 API 控制器（无需认证）

using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 计划公开 API - 无需认证，用于公开预览页
/// </summary>
[Route("api/plans")]
[ApiController]
public class PlansPublicController(IPlanService planService) : ControllerBase
{
    /// <summary>
    /// 获取公开预览的计划详情（隐藏预算等敏感信息）
    /// </summary>
    [HttpGet("{id}/public")]
    public async Task<IActionResult> GetPublicPlanById(int id)
    {
        var plan = await planService.GetPublicPlanByIdAsync(id);
        if (plan == null) return NotFound(new { message = "计划不存在" });
        return Ok(plan);
    }
}
