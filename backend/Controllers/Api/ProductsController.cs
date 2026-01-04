// ============================================================================
// Controllers/Api/ProductsController.cs - 商品公开 API
// ============================================================================
// 公开的商品浏览接口，无需登录。

using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 商品公开 API 控制器
/// 提供商品列表和详情的公开访问接口
/// </summary>
[Route("api/products")]
[ApiController]
public class ProductsController(IProductService productService) : ControllerBase
{
    /// <summary>
    /// 获取所有上架商品
    /// </summary>
    /// <returns>商品列表</returns>
    [HttpGet]
    public async Task<IActionResult> GetProducts()
    {
        var products = await productService.GetAllActiveAsync();
        return Ok(new { success = true, data = products });
    }
    
    /// <summary>
    /// 获取商品详情
    /// </summary>
    /// <param name="id">商品 ID</param>
    /// <returns>商品详情（不含敏感信息）</returns>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        var product = await productService.GetByIdAsync(id);
        
        if (product == null)
        {
            return NotFound(new { success = false, message = "商品不存在或已下架" });
        }
        
        return Ok(new { success = true, data = product });
    }
}
