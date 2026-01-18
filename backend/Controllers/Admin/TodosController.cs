// Controllers/Admin/TodosController.cs
// 待办任务管理控制器

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// 待办任务管理 API
/// </summary>
[ApiController]
[Route("api/admin/todos")]
[Authorize(Roles = "Admin")]
public class TodosController(ITodoService todoService) : ControllerBase
{
    /// <summary>
    /// 获取所有待办任务
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var todos = await todoService.GetAllAsync();
        return Ok(new { success = true, data = todos });
    }
    
    /// <summary>
    /// 获取单个任务
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var todo = await todoService.GetByIdAsync(id);
        if (todo is null)
            return NotFound(new { success = false, message = "任务不存在" });
        
        return Ok(new { success = true, data = todo });
    }
    
    /// <summary>
    /// 创建任务
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTodoDto dto)
    {
        try
        {
            var todo = await todoService.CreateAsync(dto);
            return Ok(new { success = true, data = todo, message = "任务已创建" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
    
    /// <summary>
    /// 更新任务
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTodoDto dto)
    {
        try
        {
            var todo = await todoService.UpdateAsync(id, dto);
            if (todo is null)
                return NotFound(new { success = false, message = "任务不存在" });
            
            return Ok(new { success = true, data = todo, message = "任务已更新" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
    
    /// <summary>
    /// 删除任务
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await todoService.DeleteAsync(id);
        if (!result)
            return NotFound(new { success = false, message = "任务不存在" });
        
        return Ok(new { success = true, message = "任务已删除" });
    }
    
    /// <summary>
    /// 移动任务到新阶段（拖拽跨列）
    /// </summary>
    [HttpPatch("{id:int}/move")]
    public async Task<IActionResult> Move(int id, [FromBody] MoveTodoDto dto)
    {
        var result = await todoService.MoveAsync(id, dto);
        if (!result)
            return BadRequest(new { success = false, message = "无效的阶段或任务不存在" });
        
        return Ok(new { success = true, message = "任务已移动" });
    }
    
    /// <summary>
    /// 批量更新任务排序
    /// </summary>
    [HttpPost("batch-sort")]
    public async Task<IActionResult> BatchSort([FromBody] BatchUpdateTodoSortDto dto)
    {
        var result = await todoService.BatchUpdateSortAsync(dto);
        if (!result)
            return BadRequest(new { success = false, message = "批量更新失败" });
        
        return Ok(new { success = true, message = "排序已更新" });
    }
}
