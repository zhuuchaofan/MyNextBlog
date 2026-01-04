// ============================================================================
// Models/OrderItem.cs - 订单项实体
// ============================================================================
// 此实体映射 `OrderItems` 表，存储订单中的每一件商品。
//
// **设计要点**:
//   - 商品名称和价格采用"快照"模式，防止商品信息变更影响历史订单
//   - 保留 ProductId 外键，便于关联查询商品详情（如下载链接）

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Models;

/// <summary>
/// `OrderItem` 实体代表订单中的一件商品。
/// 
/// **快照字段**:
///   - `ProductName`: 下单时的商品名称
///   - `Price`: 下单时的商品单价
/// </summary>
public class OrderItem
{
    public int Id { get; set; }
    
    /// <summary>
    /// 所属订单 ID (FK → Order)
    /// </summary>
    public int OrderId { get; set; }
    
    /// <summary>
    /// 商品 ID (FK → Product)
    /// </summary>
    public int ProductId { get; set; }
    
    /// <summary>
    /// 商品名称快照（下单时锁定）
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string ProductName { get; set; } = string.Empty;
    
    /// <summary>
    /// 商品单价快照（下单时锁定）
    /// </summary>
    [Range(0, 999999.99)]
    public decimal Price { get; set; }
    
    /// <summary>
    /// 购买数量
    /// </summary>
    [Range(1, 999)]
    public int Quantity { get; set; } = 1;
    
    // ===== 导航属性 =====
    
    /// <summary>
    /// 关联订单
    /// </summary>
    public Order Order { get; set; } = null!;
    
    /// <summary>
    /// 关联商品（用于获取下载链接等敏感信息）
    /// </summary>
    public Product Product { get; set; } = null!;
}
