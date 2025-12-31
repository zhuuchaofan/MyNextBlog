// ============================================================================
// Controllers/Api/AnniversariesController.cs - 纪念日 API 控制器
// ============================================================================
// 此控制器处理纪念日相关的 HTTP 请求。
//
// **公开接口**: GET (获取启用的纪念日)
// **管理接口**: CRUD 操作 (需要 Admin 权限)

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Authorization;  // 授权特性
using Microsoft.AspNetCore.Mvc;            // ASP.NET Core MVC
using MyNextBlog.DTOs;                     // 数据传输对象
using MyNextBlog.Services;                 // 业务服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `AnniversariesController` 是纪念日模块的 API 控制器。
/// 
/// **路由**: `/api/anniversaries`
/// **公开接口**: GET (启用的纪念日)
/// **管理接口**: admin/*, POST, PUT, DELETE
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class AnniversariesController(IAnniversaryService anniversaryService) : ControllerBase
{
    /// <summary>
    /// 获取所有启用的纪念日（公开 API）
    /// GET /api/anniversaries
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetActiveAnniversaries()
    {
        var anniversaries = await anniversaryService.GetActiveAnniversariesAsync();
        return Ok(anniversaries);
    }
    
    /// <summary>
    /// 获取所有纪念日，包含禁用的（管理员专用）
    /// GET /api/anniversaries/admin
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllAnniversaries()
    {
        var anniversaries = await anniversaryService.GetAllAnniversariesAsync();
        return Ok(anniversaries);
    }
    
    /// <summary>
    /// 获取单个纪念日详情（管理员专用）
    /// GET /api/anniversaries/admin/{id}
    /// </summary>
    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var anniversary = await anniversaryService.GetByIdAsync(id);
        if (anniversary == null)
            return NotFound(new { message = "纪念日不存在" });
        
        return Ok(anniversary);
    }
    
    /// <summary>
    /// 创建纪念日（管理员专用）
    /// POST /api/anniversaries
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateAnniversaryDto dto)
    {
        var anniversary = await anniversaryService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = anniversary.Id }, anniversary);
    }
    
    /// <summary>
    /// 更新纪念日（管理员专用）
    /// PUT /api/anniversaries/{id}
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAnniversaryDto dto)
    {
        var anniversary = await anniversaryService.UpdateAsync(id, dto);
        if (anniversary == null)
            return NotFound(new { message = "纪念日不存在" });
        
        return Ok(anniversary);
    }
    
    /// <summary>
    /// 删除纪念日（管理员专用）
    /// DELETE /api/anniversaries/{id}
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await anniversaryService.DeleteAsync(id);
        if (!success)
            return NotFound(new { message = "纪念日不存在" });
        
        return NoContent();
    }
}
