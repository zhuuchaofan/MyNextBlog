// ============================================================================
// Controllers/Api/FriendLinksController.cs - 友链 API 控制器
// ============================================================================
// 提供友链的公开和管理 API 接口。

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 友链 API 控制器
/// 提供友链的公开展示和管理员 CRUD 接口
/// </summary>
[Route("api/friend-links")]
[ApiController]
public class FriendLinksController(
    IFriendLinkService friendLinkService,
    ILogger<FriendLinksController> logger) : ControllerBase
{
    // ========== 公开 API ==========
    
    /// <summary>
    /// 获取所有启用的友链 (公开 API)
    /// GET /api/friend-links
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllActive()
    {
        var links = await friendLinkService.GetAllActiveAsync();
        return Ok(new { success = true, data = links });
    }
    
    // ========== 管理员 API ==========
    
    /// <summary>
    /// 获取所有友链 (管理员，包含禁用的)
    /// GET /api/friend-links/admin
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllAdmin()
    {
        var links = await friendLinkService.GetAllAsync();
        return Ok(new { success = true, data = links });
    }
    
    /// <summary>
    /// 获取单个友链详情
    /// GET /api/friend-links/admin/{id}
    /// </summary>
    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var link = await friendLinkService.GetByIdAsync(id);
        if (link == null)
        {
            return NotFound(new { success = false, message = "友链不存在" });
        }
        return Ok(new { success = true, data = link });
    }
    
    /// <summary>
    /// 创建友链
    /// POST /api/friend-links/admin
    /// </summary>
    [HttpPost("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateFriendLinkDto dto)
    {
        // 验证 URL 格式
        if (!Uri.TryCreate(dto.Url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "http" && uri.Scheme != "https"))
        {
            return BadRequest(new { success = false, message = "URL 格式无效，必须是完整的 HTTP/HTTPS 地址" });
        }
        
        // 验证名称
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { success = false, message = "友站名称不能为空" });
        }
        
        var link = await friendLinkService.CreateAsync(dto);
        logger.LogInformation("创建友链: {Id} - {Name}", link.Id, link.Name);
        
        return CreatedAtAction(
            nameof(GetById), 
            new { id = link.Id }, 
            new { success = true, data = link }
        );
    }
    
    /// <summary>
    /// 更新友链
    /// PUT /api/friend-links/admin/{id}
    /// </summary>
    [HttpPut("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFriendLinkDto dto)
    {
        // 验证 URL 格式
        if (!Uri.TryCreate(dto.Url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "http" && uri.Scheme != "https"))
        {
            return BadRequest(new { success = false, message = "URL 格式无效" });
        }
        
        var link = await friendLinkService.UpdateAsync(id, dto);
        if (link == null)
        {
            return NotFound(new { success = false, message = "友链不存在" });
        }
        
        logger.LogInformation("更新友链: {Id} - {Name}", id, link.Name);
        return Ok(new { success = true, data = link });
    }
    
    /// <summary>
    /// 删除友链
    /// DELETE /api/friend-links/admin/{id}
    /// </summary>
    [HttpDelete("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await friendLinkService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(new { success = false, message = "友链不存在" });
        }
        
        logger.LogInformation("删除友链: {Id}", id);
        return Ok(new { success = true, message = "删除成功" });
    }
}
