// ============================================================================
// Models/Order.cs - 订单实体
// ============================================================================
// 此实体映射 `Orders` 表，存储用户的购买订单记录。
//
// **状态流转**:
//   Pending (待付款) → Paid (已付款/自动发货) → Completed (已确认收货)
//                   ↘ Cancelled (已取消)

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Models;

/// <summary>
/// 订单状态枚举
/// </summary>
public enum OrderStatus
{
    /// <summary>
    /// 待付款 - 订单已创建，等待用户付款
    /// </summary>
    Pending = 0,
    
    /// <summary>
    /// 已付款 - 虚拟商品已自动发货（邮件已发送）
    /// </summary>
    Paid = 1,
    
    /// <summary>
    /// 已完成 - 用户已确认收货
    /// </summary>
    Completed = 2,
    
    /// <summary>
    /// 已取消 - 订单被取消（管理员或超时）
    /// </summary>
    Cancelled = 3
}

/// <summary>
/// `Order` 实体代表一个购买订单。
/// 
/// **特性**:
///   - 唯一订单号 (OrderNo) 便于查询和展示
///   - 关联用户 (UserId)
///   - 包含多个订单项 (OrderItems)
/// </summary>
public class Order
{
    public int Id { get; set; }
    
    /// <summary>
    /// 订单号，格式：ORD + 时间戳 + 随机数
    /// 例如：ORD20260104200912A3B5
    /// </summary>
    [Required]
    [MaxLength(30)]
    public string OrderNo { get; set; } = string.Empty;
    
    /// <summary>
    /// 下单用户 ID (FK → User)
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// 订单状态
    /// </summary>
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    
    /// <summary>
    /// 订单总金额（下单时计算并锁定）
    /// </summary>
    [Range(0, 9999999.99)]
    public decimal TotalAmount { get; set; }
    
    /// <summary>
    /// 用户备注
    /// </summary>
    [MaxLength(500)]
    public string? Remark { get; set; }
    
    /// <summary>
    /// 下单时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 付款时间
    /// </summary>
    public DateTime? PaidAt { get; set; }
    
    /// <summary>
    /// 完成时间（确认收货）
    /// </summary>
    public DateTime? CompletedAt { get; set; }
    
    // ===== 导航属性 =====
    
    /// <summary>
    /// 关联用户
    /// </summary>
    public User User { get; set; } = null!;
    
    /// <summary>
    /// 订单项列表
    /// </summary>
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
