// ============================================================================
// DTOs/OrderDtos.cs - 订单相关数据传输对象
// ============================================================================
// 定义订单模块的所有 DTO，用于 API 层数据交换。
//
// **安全设计**:
//   - `OrderItemDto.DownloadUrl` 和 `RedeemCode` 仅在订单状态为 Paid/Completed 时填充
//   - 由 OrderService 在映射时根据状态条件处理

namespace MyNextBlog.DTOs;

/// <summary>
/// 订单列表项 DTO
/// </summary>
public record OrderDto(
    int Id,
    string OrderNo,
    string Status,
    decimal TotalAmount,
    DateTime CreatedAt,
    DateTime? PaidAt,
    DateTime? CompletedAt,
    List<OrderItemDto> Items
);

/// <summary>
/// 订单项 DTO
/// </summary>
/// <param name="ProductId">商品 ID</param>
/// <param name="ProductName">商品名称快照</param>
/// <param name="Price">商品单价快照</param>
/// <param name="Quantity">数量</param>
/// <param name="DownloadUrl">下载链接（仅付款后可见）</param>
/// <param name="RedeemCode">兑换码（仅付款后可见）</param>
public record OrderItemDto(
    int ProductId,
    string ProductName,
    decimal Price,
    int Quantity,
    string? DownloadUrl = null,
    string? RedeemCode = null
);

/// <summary>
/// 创建订单请求 DTO
/// </summary>
public record CreateOrderDto(
    List<OrderItemInput> Items,
    string? Remark = null
);

/// <summary>
/// 订单项输入（创建订单用）
/// </summary>
public record OrderItemInput(
    int ProductId,
    int Quantity
);

/// <summary>
/// 订单管理 DTO（管理员）
/// 包含用户信息
/// </summary>
public record OrderAdminDto(
    int Id,
    string OrderNo,
    string Status,
    decimal TotalAmount,
    DateTime CreatedAt,
    DateTime? PaidAt,
    DateTime? CompletedAt,
    int UserId,
    string? Username,
    string? UserEmail,
    List<OrderItemDto> Items
);
