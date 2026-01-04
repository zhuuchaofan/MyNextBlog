// ============================================================================
// Controllers/Admin/ProductsController.cs - 商品管理 API
// ============================================================================
// 管理员专用的商品 CRUD 接口。
//
// **路由规范 (Rule 10.1)**:
//   - 管理员 Controller 位于 Controllers/Admin/ 目录
//   - 命名空间: MyNextBlog.Controllers.Admin
//   - 路由前缀: api/admin/*

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// 商品管理 API 控制器（管理员）
/// </summary>
[Route("api/admin/products")]
[ApiController]
[Authorize(Roles = "Admin")]
public class ProductsController(IProductService productService) : ControllerBase
{
    /// <summary>
    /// 获取所有商品（含下架）
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var products = await productService.GetAllAsync();
        return Ok(new { success = true, data = products });
    }
    
    /// <summary>
    /// 获取商品详情（含敏感信息）
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        var product = await productService.GetAdminByIdAsync(id);
        
        if (product == null)
        {
            return NotFound(new { success = false, message = "商品不存在" });
        }
        
        return Ok(new { success = true, data = product });
    }
    
    /// <summary>
    /// 创建商品
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { success = false, message = "商品名称不能为空" });
        }
        
        var product = await productService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, new { success = true, data = product });
    }
    
    /// <summary>
    /// 更新商品
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        var success = await productService.UpdateAsync(id, dto);
        
        if (!success)
        {
            return NotFound(new { success = false, message = "商品不存在" });
        }
        
        return Ok(new { success = true, message = "商品已更新" });
    }
    
    /// <summary>
    /// 删除商品
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var success = await productService.DeleteAsync(id);
        
        if (!success)
        {
            return BadRequest(new { success = false, message = "删除失败（商品不存在或有关联订单）" });
        }
        
        return Ok(new { success = true, message = "商品已删除" });
    }
}
