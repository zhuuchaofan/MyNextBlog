// ============================================================================
// Controllers/Api/MemosController.cs - Memo API 控制器
// ============================================================================
// 提供 Memo 的公开和管理 API 接口。

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// Memo API 控制器
/// 提供 Memo 的公开展示和管理员 CRUD 接口
/// </summary>
[Route("api/memos")]
[ApiController]
public class MemosController(
    IMemoService memoService,
    ILogger<MemosController> logger) : ControllerBase
{
    // ========== 公开 API ==========
    
    /// <summary>
    /// 获取公开的 Memo 列表 (Keyset Pagination)
    /// GET /api/memos?cursor=xxx&limit=20
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPublicMemos(
        [FromQuery] string? cursor = null,
        [FromQuery] int limit = 20)
    {
        var result = await memoService.GetPublicMemosAsync(cursor, limit);
        return Ok(new { success = true, data = result.Items, nextCursor = result.NextCursor });
    }
    
    /// <summary>
    /// 获取年度热力图数据
    /// GET /api/memos/heatmap?year=2026
    /// </summary>
    [HttpGet("heatmap")]
    public async Task<IActionResult> GetHeatmap([FromQuery] int? year = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var data = await memoService.GetHeatmapDataAsync(targetYear);
        return Ok(new { success = true, data, year = targetYear });
    }
    
    // ========== 管理员 API ==========
    
    /// <summary>
    /// 获取所有 Memo (管理员)
    /// GET /api/memos/admin?page=1&pageSize=20
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllAdmin(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var memos = await memoService.GetAllAsync(page, pageSize);
        var totalCount = await memoService.GetCountAsync(includePrivate: true);
        
        return Ok(new
        {
            success = true,
            data = memos,
            meta = new
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            }
        });
    }
    
    /// <summary>
    /// 获取单个 Memo 详情
    /// GET /api/memos/admin/{id}
    /// </summary>
    [HttpGet("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetById(int id)
    {
        var memo = await memoService.GetByIdAsync(id);
        if (memo == null)
        {
            return NotFound(new { success = false, message = "Memo 不存在" });
        }
        return Ok(new { success = true, data = memo });
    }
    
    /// <summary>
    /// 创建 Memo
    /// POST /api/memos/admin
    /// </summary>
    [HttpPost("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateMemoDto dto)
    {
        // 验证内容
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { success = false, message = "内容不能为空" });
        }
        
        // 限制内容长度
        if (dto.Content.Length > 2000)
        {
            return BadRequest(new { success = false, message = "内容不能超过 2000 字" });
        }
        
        var memo = await memoService.CreateAsync(dto);
        logger.LogInformation("创建 Memo: {Id}", memo.Id);
        
        return CreatedAtAction(
            nameof(GetById),
            new { id = memo.Id },
            new { success = true, data = memo }
        );
    }
    
    /// <summary>
    /// 更新 Memo
    /// PUT /api/memos/admin/{id}
    /// </summary>
    [HttpPut("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMemoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { success = false, message = "内容不能为空" });
        }
        
        if (dto.Content.Length > 2000)
        {
            return BadRequest(new { success = false, message = "内容不能超过 2000 字" });
        }
        
        var memo = await memoService.UpdateAsync(id, dto);
        if (memo == null)
        {
            return NotFound(new { success = false, message = "Memo 不存在" });
        }
        
        logger.LogInformation("更新 Memo: {Id}", id);
        return Ok(new { success = true, data = memo });
    }
    
    /// <summary>
    /// 删除 Memo
    /// DELETE /api/memos/admin/{id}
    /// </summary>
    [HttpDelete("admin/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await memoService.DeleteAsync(id);
        if (!result)
        {
            return NotFound(new { success = false, message = "Memo 不存在" });
        }
        
        logger.LogInformation("删除 Memo: {Id}", id);
        return Ok(new { success = true, message = "删除成功" });
    }
}
