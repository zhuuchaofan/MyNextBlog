using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyTechBlog.Services;

namespace MyTechBlog.Controllers.Api;

[Authorize(Roles = "Admin")] // 只有管理员能添加分类
[Route("api/[controller]")]
[ApiController]
public class CategoriesController(ICategoryService categoryService) : ControllerBase
{
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

    [HttpGet]
    [AllowAnonymous] // 允许所有人获取分类列表
    public async Task<IActionResult> GetAll()
    {
        var categories = await categoryService.GetAllCategoriesAsync();
        return Ok(new { success = true, data = categories });
    }

    // DTO (Data Transfer Object) 用于接收前端数据
    public record CreateCategoryDto(string Name);
}