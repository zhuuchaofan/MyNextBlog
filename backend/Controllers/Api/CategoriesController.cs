using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 分类管理控制器
/// 默认所有写操作都需要 Admin 权限，读操作公开
/// </summary>
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
[Route("api/[controller]")]
[ApiController]
public class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    /// <summary>
    /// 创建新分类 (管理员)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { success = false, message = "分类名称不能为空" });
        }

        if (await categoryService.ExistsAsync(dto.Name))
        {
            return Conflict(new { success = false, message = "该分类已存在" });
        }

        var newCategory = await categoryService.AddCategoryAsync(dto.Name);
        return Ok(new { success = true, category = newCategory });
    }

    /// <summary>
    /// 获取所有分类 (公开)
    /// </summary>
    [HttpGet]
    [AllowAnonymous] 
    public async Task<IActionResult> GetAll()
    {
        var categories = await categoryService.GetAllCategoriesAsync();
        return Ok(new { success = true, data = categories });
    }

    /// <summary>
    /// 根据 ID 获取分类详情 (公开)
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await categoryService.GetByIdAsync(id);
        if (category == null)
        {
            return NotFound(new { success = false, message = "分类不存在" });
        }
        return Ok(new { success = true, data = category });
    }

    public record CreateCategoryDto(string Name);
}
