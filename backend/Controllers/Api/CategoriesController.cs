// ============================================================================
// Controllers/Api/CategoriesController.cs - 分类 API 控制器
// ============================================================================
// 此控制器处理文章分类相关的 HTTP 请求。
//
// **权限**:
//   - 读操作 (GET): 公开
//   - 写操作 (POST): 需要 Admin 权限

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Authentication.JwtBearer;  // JWT 认证方案
using Microsoft.AspNetCore.Authorization;              // 授权特性
using Microsoft.AspNetCore.Mvc;                        // ASP.NET Core MVC
using MyNextBlog.DTOs;                                 // 数据传输对象
using MyNextBlog.Services;                             // 业务服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `CategoriesController` 是分类模块的 API 控制器。
/// 
/// **路由**: `/api/categories`
/// **默认权限**: Admin (类级别)
/// **公开接口**: GET (用 [AllowAnonymous] 覆盖)
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
        // 自动验证：如果模型状态无效，[ApiController] 属性会自动返回 400 BadRequest

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
}