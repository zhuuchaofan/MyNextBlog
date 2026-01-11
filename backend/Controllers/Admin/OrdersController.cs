// ============================================================================
// Controllers/Admin/OrdersController.cs - 订单管理 API
// ============================================================================
// 管理员的订单管理接口。
//
// **路由规范 (Rule 10.1)**:
//   - 管理员 Controller 位于 Controllers/Admin/ 目录
//   - 命名空间: MyNextBlog.Controllers.Admin
//   - 路由前缀: api/admin/*

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// 订单管理 API 控制器（管理员）
/// </summary>
[Route("api/admin/orders")]
[ApiController]
[Authorize(Roles = "Admin")]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    /// <summary>
    /// 获取所有订单（分页）
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (orders, totalCount) = await orderService.GetAllOrdersAsync(page, pageSize);
        
        return Ok(new
        {
            success = true,
            data = orders,
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
    /// 取消订单
    /// </summary>
    [HttpPost("{id:int}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelOrder(int id)
    {
        try
        {
            var success = await orderService.CancelOrderAsync(id);
            
            if (!success)
            {
                return NotFound(new { success = false, message = "订单不存在" });
            }
            
            return Ok(new { success = true, message = "订单已取消" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}
