// ============================================================================
// DTOs/ProductDtos.cs - 商品相关数据传输对象
// ============================================================================
// 定义商品模块的所有 DTO，用于 API 层数据交换。
//
// **安全设计**:
//   - 公开 DTO (`ProductDto`, `ProductDetailDto`) 不包含 DownloadUrl/RedeemCode
//   - 管理员 DTO 可查看完整信息

namespace MyNextBlog.DTOs;

/// <summary>
/// 商品列表项 DTO（公开）
/// 用于商品列表页展示
/// </summary>
public record ProductDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    string? ImageUrl,
    int Stock,
    bool IsActive,
    DateTime CreatedAt
);

/// <summary>
/// 商品详情 DTO（公开）
/// 用于商品详情页展示，不包含敏感信息
/// </summary>
public record ProductDetailDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    string? ImageUrl,
    int Stock
);

/// <summary>
/// 商品管理 DTO（管理员）
/// 包含所有字段，用于管理后台
/// </summary>
public record ProductAdminDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    string? ImageUrl,
    string? DownloadUrl,
    string? RedeemCode,
    int Stock,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

/// <summary>
/// 创建商品请求 DTO
/// </summary>
public record CreateProductDto(
    string Name,
    string Description,
    decimal Price,
    string? ImageUrl,
    string? DownloadUrl,
    string? RedeemCode,
    int Stock = -1
);

/// <summary>
/// 更新商品请求 DTO
/// </summary>
public record UpdateProductDto(
    string Name,
    string Description,
    decimal Price,
    string? ImageUrl,
    string? DownloadUrl,
    string? RedeemCode,
    int Stock,
    bool IsActive
);
