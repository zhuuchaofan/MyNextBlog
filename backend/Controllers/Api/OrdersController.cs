// ============================================================================
// Controllers/Api/OrdersController.cs - 订单用户 API
// ============================================================================
// 用户的订单操作接口，需要登录。

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 订单用户 API 控制器
/// 提供订单创建、查询、付款、确认收货等操作
/// </summary>
[Route("api/orders")]
[ApiController]
[Authorize]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    /// <summary>
    /// 创建订单
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { success = false, message = "请先登录" });
        }
        
        try
        {
            var order = await orderService.CreateOrderAsync(userId.Value, dto);
            return Ok(new { success = true, data = order, message = "订单创建成功" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
    
    /// <summary>
    /// 获取我的订单列表
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { success = false, message = "请先登录" });
        }
        
        var orders = await orderService.GetUserOrdersAsync(userId.Value);
        return Ok(new { success = true, data = orders });
    }
    
    /// <summary>
    /// 获取订单详情
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { success = false, message = "请先登录" });
        }
        
        var order = await orderService.GetOrderByIdAsync(id, userId.Value);
        
        if (order == null)
        {
            return NotFound(new { success = false, message = "订单不存在" });
        }
        
        return Ok(new { success = true, data = order });
    }
    
    /// <summary>
    /// 模拟付款
    /// </summary>
    [HttpPost("{id:int}/pay")]
    public async Task<IActionResult> PayOrder(int id)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { success = false, message = "请先登录" });
        }
        
        try
        {
            var order = await orderService.ProcessPaymentAsync(id, userId.Value);
            
            if (order == null)
            {
                return NotFound(new { success = false, message = "订单不存在" });
            }
            
            return Ok(new { success = true, data = order, message = "付款成功，商品已通过邮件发送" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
    
    /// <summary>
    /// 确认收货
    /// </summary>
    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> ConfirmReceipt(int id)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { success = false, message = "请先登录" });
        }
        
        try
        {
            var success = await orderService.ConfirmReceiptAsync(id, userId.Value);
            
            if (!success)
            {
                return NotFound(new { success = false, message = "订单不存在" });
            }
            
            return Ok(new { success = true, message = "已确认收货" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
    
    /// <summary>
    /// 用户取消自己的订单（仅限待付款状态）
    /// </summary>
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelOrder(int id)
    {
        var userId = GetUserId();
        if (userId == null)
        {
            return Unauthorized(new { success = false, message = "请先登录" });
        }
        
        try
        {
            var success = await orderService.CancelOrderByUserAsync(id, userId.Value);
            
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
    
    /// <summary>
    /// 获取当前登录用户 ID
    /// </summary>
    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return null;
    }
}
