// Controllers/Admin/PlansController.cs
// 计划管理 API 控制器（仅管理员可访问）

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// 计划管理 API - 仅管理员可访问
/// </summary>
[Authorize(Roles = "Admin")]
[Route("api/admin/plans")]
[ApiController]
public class PlansController(IPlanService planService) : ControllerBase
{
    // ========== Plan CRUD ==========
    
    /// <summary>
    /// 获取所有计划列表
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var plans = await planService.GetAllPlansAsync();
        return Ok(new { success = true, data = plans });
    }
    
    /// <summary>
    /// 获取计划详情（含日程和活动）
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var plan = await planService.GetPlanByIdAsync(id);
        if (plan == null) return NotFound(new { success = false, message = "计划不存在" });
        return Ok(new { success = true, data = plan });
    }
    
    /// <summary>
    /// 创建新计划
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlanDto dto)
    {
        var plan = await planService.CreatePlanAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = plan.Id }, new { success = true, data = plan });
    }
    
    /// <summary>
    /// 更新计划
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePlanDto dto)
    {
        var plan = await planService.UpdatePlanAsync(id, dto);
        if (plan == null) return NotFound(new { success = false, message = "计划不存在" });
        return Ok(new { success = true, data = plan });
    }
    
    /// <summary>
    /// 删除计划
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await planService.DeletePlanAsync(id);
        if (!result) return NotFound(new { success = false, message = "计划不存在" });
        return Ok(new { success = true, message = "删除成功" });
    }
    
    /// <summary>
    /// 获取计划预算统计
    /// </summary>
    [HttpGet("{id}/budget")]
    public async Task<IActionResult> GetBudget(int id)
    {
        var (totalEstimated, totalActual) = await planService.GetBudgetSummaryAsync(id);
        return Ok(new { success = true, data = new { totalEstimated, totalActual } });
    }
    
    // ========== PlanDay CRUD ==========
    
    /// <summary>
    /// 为计划添加一天
    /// </summary>
    [HttpPost("{planId}/days")]
    public async Task<IActionResult> AddDay(int planId, [FromBody] CreatePlanDayDto dto)
    {
        var day = await planService.AddDayAsync(planId, dto);
        return Ok(new { success = true, data = day });
    }
    
    /// <summary>
    /// 更新某天
    /// </summary>
    [HttpPut("{planId}/days/{dayId}")]
    public async Task<IActionResult> UpdateDay(int planId, int dayId, [FromBody] UpdatePlanDayDto dto)
    {
        var day = await planService.UpdateDayAsync(dayId, dto);
        if (day == null) return NotFound(new { success = false, message = "日程不存在" });
        return Ok(new { success = true, data = day });
    }
    
    /// <summary>
    /// 删除某天
    /// </summary>
    [HttpDelete("{planId}/days/{dayId}")]
    public async Task<IActionResult> DeleteDay(int planId, int dayId)
    {
        var result = await planService.DeleteDayAsync(dayId);
        if (!result) return NotFound(new { success = false, message = "日程不存在" });
        return Ok(new { success = true, message = "删除成功" });
    }
}

/// <summary>
/// 活动管理 API - 独立路由
/// </summary>
[Authorize(Roles = "Admin")]
[Route("api/admin")]
[ApiController]
public class ActivitiesController(IPlanService planService) : ControllerBase
{
    /// <summary>
    /// 为某天添加活动
    /// </summary>
    [HttpPost("days/{dayId}/activities")]
    public async Task<IActionResult> AddActivity(int dayId, [FromBody] CreateActivityDto dto)
    {
        var activity = await planService.AddActivityAsync(dayId, dto);
        return Ok(new { success = true, data = activity });
    }
    
    /// <summary>
    /// 更新活动
    /// </summary>
    [HttpPut("activities/{id}")]
    public async Task<IActionResult> UpdateActivity(int id, [FromBody] UpdateActivityDto dto)
    {
        var activity = await planService.UpdateActivityAsync(id, dto);
        if (activity == null) return NotFound(new { success = false, message = "活动不存在" });
        return Ok(new { success = true, data = activity });
    }
    
    /// <summary>
    /// 删除活动
    /// </summary>
    [HttpDelete("activities/{id}")]
    public async Task<IActionResult> DeleteActivity(int id)
    {
        var result = await planService.DeleteActivityAsync(id);
        if (!result) return NotFound(new { success = false, message = "活动不存在" });
        return Ok(new { success = true, message = "删除成功" });
    }
    
    /// <summary>
    /// 批量更新活动排序（拖拽排序优化）
    /// </summary>
    [HttpPatch("activities/batch-sort")]
    public async Task<IActionResult> BatchUpdateSort([FromBody] BatchUpdateActivitySortDto dto)
    {
        await planService.BatchUpdateActivitySortOrderAsync(dto.Items);
        return Ok(new { success = true, message = "排序更新成功" });
    }
}
