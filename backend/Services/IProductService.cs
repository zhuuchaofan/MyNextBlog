// ============================================================================
// Services/IProductService.cs - 商品服务接口
// ============================================================================

using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

/// <summary>
/// 商品服务接口
/// </summary>
public interface IProductService
{
    // --- 公开 API ---
    
    /// <summary>
    /// 获取所有上架商品（公开）
    /// </summary>
    Task<List<ProductDto>> GetAllActiveAsync();
    
    /// <summary>
    /// 根据 ID 获取商品详情（公开）
    /// </summary>
    Task<ProductDetailDto?> GetByIdAsync(int id);
    
    // --- 管理员 API ---
    
    /// <summary>
    /// 获取所有商品（含下架，管理员）
    /// </summary>
    Task<List<ProductAdminDto>> GetAllAsync();
    
    /// <summary>
    /// 根据 ID 获取商品完整信息（管理员）
    /// </summary>
    Task<ProductAdminDto?> GetAdminByIdAsync(int id);
    
    /// <summary>
    /// 创建商品
    /// </summary>
    Task<ProductAdminDto> CreateAsync(CreateProductDto dto);
    
    /// <summary>
    /// 更新商品
    /// </summary>
    Task<bool> UpdateAsync(int id, UpdateProductDto dto);
    
    /// <summary>
    /// 删除商品（硬删除，有订单时会失败）
    /// </summary>
    Task<bool> DeleteAsync(int id);
}
