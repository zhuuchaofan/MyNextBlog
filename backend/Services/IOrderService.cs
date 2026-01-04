// ============================================================================
// Services/IOrderService.cs - 订单服务接口
// ============================================================================

using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

/// <summary>
/// 订单服务接口
/// </summary>
public interface IOrderService
{
    // --- 用户 API ---
    
    /// <summary>
    /// 创建订单
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="dto">订单数据</param>
    /// <returns>创建的订单 DTO</returns>
    Task<OrderDto> CreateOrderAsync(int userId, CreateOrderDto dto);
    
    /// <summary>
    /// 获取用户的所有订单
    /// </summary>
    Task<List<OrderDto>> GetUserOrdersAsync(int userId);
    
    /// <summary>
    /// 获取订单详情（用户只能看自己的订单）
    /// </summary>
    Task<OrderDto?> GetOrderByIdAsync(int orderId, int userId);
    
    /// <summary>
    /// 处理支付（模拟付款 → 自动发货）
    /// </summary>
    Task<OrderDto?> ProcessPaymentAsync(int orderId, int userId);
    
    /// <summary>
    /// 确认收货
    /// </summary>
    Task<bool> ConfirmReceiptAsync(int orderId, int userId);
    
    // --- 管理员 API ---
    
    /// <summary>
    /// 获取所有订单（分页）
    /// </summary>
    Task<(List<OrderAdminDto> Orders, int TotalCount)> GetAllOrdersAsync(int page, int pageSize);
    
    /// <summary>
    /// 取消订单
    /// </summary>
    Task<bool> CancelOrderAsync(int orderId);
}
