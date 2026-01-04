// ============================================================================
// Models/Product.cs - 商品实体
// ============================================================================
// 此实体映射 `Products` 表，存储虚拟商品信息（电子书、课程、兑换码等）。
//
// **安全说明**:
//   - `DownloadUrl` 和 `RedeemCode` 是敏感字段，仅在订单付款后才对用户可见
//   - 公开 API 的 DTO 不应包含这些字段

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Models;

/// <summary>
/// `Product` 实体代表可购买的虚拟商品。
/// 
/// **特性**:
///   - 支持无限库存 (Stock = -1)
///   - 软下架 (IsActive = false)
/// </summary>
public class Product
{
    public int Id { get; set; }
    
    /// <summary>
    /// 商品名称
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 商品描述，支持 Markdown 格式
    /// </summary>
    [Required]
    public string Description { get; set; } = string.Empty;
    
    /// <summary>
    /// 价格（单位：元）
    /// </summary>
    [Range(0, 999999.99)]
    public decimal Price { get; set; }
    
    /// <summary>
    /// 商品封面图 URL
    /// </summary>
    [MaxLength(500)]
    public string? ImageUrl { get; set; }
    
    /// <summary>
    /// 虚拟商品下载链接（付款后可见）
    /// 例如：S3/R2 预签名链接、网盘地址等
    /// </summary>
    [MaxLength(1000)]
    public string? DownloadUrl { get; set; }
    
    /// <summary>
    /// 兑换码（付款后可见）
    /// 例如：软件激活码、课程邀请码等
    /// </summary>
    [MaxLength(200)]
    public string? RedeemCode { get; set; }
    
    /// <summary>
    /// 库存数量
    /// -1 表示无限库存（虚拟商品常用）
    /// </summary>
    public int Stock { get; set; } = -1;
    
    /// <summary>
    /// 是否上架（软下架机制）
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
    
    // ===== 导航属性 =====
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
