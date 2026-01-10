// ============================================================================
// Controllers/Api/PresenceController.cs - 用户在线状态 API 控制器
// ============================================================================
// 此控制器提供"数字分身"功能的 HTTP 接口。
//
// **端点**:
//   - GET /api/presence: 获取当前状态（公开）
//   - POST /api/presence/override: 设置手动覆盖（Admin）
//   - DELETE /api/presence/override: 清除手动覆盖（Admin）

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 用户在线状态 API 控制器
/// 
/// **职责**:
///   - 提供前端轮询接口
///   - 提供管理员手动控制接口
/// </summary>
[ApiController]
[Route("api/presence")]
public class PresenceController(
    IPresenceService presenceService,
    ILogger<PresenceController> logger) : ControllerBase
{
    /// <summary>
    /// 获取当前用户状态（公开接口）
    /// </summary>
    /// <returns>用户状态 DTO</returns>
    [HttpGet]
    [ProducesResponseType(typeof(UserPresenceResponse), StatusCodes.Status200OK)]
    public IActionResult GetStatus()
    {
        var status = presenceService.GetCurrentStatus();
        return Ok(new { success = true, data = status });
    }

    /// <summary>
    /// 设置手动状态覆盖（Admin）
    /// </summary>
    /// <param name="dto">覆盖请求</param>
    [HttpPost("override")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetOverride([FromBody] SetPresenceOverrideDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Status))
        {
            return BadRequest(new { success = false, message = "状态不能为空" });
        }

        await presenceService.SetOverrideAsync(dto.Status, dto.Message, dto.ExpireAt);
        
        logger.LogInformation("管理员设置状态覆盖: {Status}", dto.Status);
        
        return Ok(new { success = true, message = "状态已更新" });
    }

    /// <summary>
    /// 清除手动状态覆盖（Admin）
    /// </summary>
    [HttpDelete("override")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ClearOverride()
    {
        await presenceService.ClearOverrideAsync();
        
        logger.LogInformation("管理员清除状态覆盖");
        
        return Ok(new { success = true, message = "已恢复自动检测" });
    }
}
