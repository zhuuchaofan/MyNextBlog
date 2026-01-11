// ============================================================================
// Controllers/Api/TagsController.cs - 标签 API 控制器
// ============================================================================
// 此控制器提供文章标签的完整 CRUD 功能。
//
// **权限**:
//   - 读操作 (GET): 公开
//   - 写操作 (POST/PUT/DELETE): 需要 Admin 权限

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Authentication.JwtBearer;  // JWT 认证方案
using Microsoft.AspNetCore.Authorization;              // 授权特性
using Microsoft.AspNetCore.Mvc;                        // ASP.NET Core MVC
using MyNextBlog.DTOs;                                 // 数据传输对象
using MyNextBlog.Services;                             // 业务服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `TagsController` 是标签模块的 API 控制器。
/// 
/// **路由**: `/api/tags`
/// **默认权限**: Admin (类级别)
/// **公开接口**: GET (用 [AllowAnonymous] 覆盖)
/// </summary>
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
[Route("api/tags")]
[ApiController]
public class TagsController(ITagService tagService) : ControllerBase
{
    /// <summary>
    /// 获取热门标签 (公开)
    /// </summary>
    /// <param name="count">返回数量 (默认10)</param>
    /// <returns>按使用频率排序的标签名称列表</returns>
    [HttpGet("popular")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPopular(int count = 10)
    {
        // 边界保护：限制返回数量范围
        count = Math.Clamp(count, 1, 50);
        
        // 热门标签作为展示型数据，始终只统计公开文章，保持数据一致性
        var tags = await tagService.GetPopularTagsAsync(count, includeHidden: false);
        return Ok(new { success = true, data = tags.Select(t => t.Name) });
    }

    /// <summary>
    /// 获取所有标签 (公开)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var tags = await tagService.GetAllTagsAsync();
        return Ok(new { success = true, data = tags });
    }

    /// <summary>
    /// 根据 ID 获取标签详情 (公开)
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var tag = await tagService.GetByIdAsync(id);
        if (tag == null)
        {
            return NotFound(new { success = false, message = "标签不存在" });
        }
        return Ok(new { success = true, data = tag });
    }

    /// <summary>
    /// 创建新标签 (管理员)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateTagDto dto)
    {
        if (await tagService.ExistsAsync(dto.Name))
        {
            return Conflict(new { success = false, message = "该标签已存在" });
        }

        var newTag = await tagService.AddTagAsync(dto.Name);
        return Ok(new { success = true, data = newTag });
    }

    /// <summary>
    /// 更新标签名称 (管理员)
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTagDto dto)
    {
        // 检查是否存在
        var existing = await tagService.GetByIdAsync(id);
        if (existing == null)
        {
            return NotFound(new { success = false, message = "标签不存在" });
        }

        // 如果名称变更，检查是否重复
        if (existing.Name != dto.Name.Trim() && await tagService.ExistsAsync(dto.Name))
        {
            return Conflict(new { success = false, message = "该标签名称已存在" });
        }

        var updated = await tagService.UpdateAsync(id, dto.Name);
        return Ok(new { success = true, data = updated });
    }

    /// <summary>
    /// 删除标签 (管理员)
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(int id)
    {
        var (success, error) = await tagService.DeleteAsync(id);
        
        if (!success)
        {
            return BadRequest(new { success = false, message = error });
        }

        return Ok(new { success = true, message = "标签已删除" });
    }
}