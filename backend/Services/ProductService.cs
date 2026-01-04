// ============================================================================
// Services/ProductService.cs - 商品服务实现
// ============================================================================
// 商品的 CRUD 操作，区分公开和管理员接口。
//
// **安全设计**:
//   - 公开接口不返回 DownloadUrl/RedeemCode
//   - 管理员接口返回完整信息

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 商品服务实现
/// </summary>
public class ProductService : IProductService
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductService> _logger;
    
    public ProductService(AppDbContext context, ILogger<ProductService> logger)
    {
        _context = context;
        _logger = logger;
    }
    
    // --- 公开 API ---
    
    public async Task<List<ProductDto>> GetAllActiveAsync()
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.ImageUrl,
                p.Stock,
                p.IsActive,
                p.CreatedAt
            ))
            .ToListAsync();
    }
    
    public async Task<ProductDetailDto?> GetByIdAsync(int id)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.Id == id && p.IsActive)
            .Select(p => new ProductDetailDto(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.ImageUrl,
                p.Stock
            ))
            .FirstOrDefaultAsync();
    }
    
    // --- 管理员 API ---
    
    public async Task<List<ProductAdminDto>> GetAllAsync()
    {
        return await _context.Products
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProductAdminDto(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.ImageUrl,
                p.DownloadUrl,
                p.RedeemCode,
                p.Stock,
                p.IsActive,
                p.CreatedAt,
                p.UpdatedAt
            ))
            .ToListAsync();
    }
    
    public async Task<ProductAdminDto?> GetAdminByIdAsync(int id)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new ProductAdminDto(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.ImageUrl,
                p.DownloadUrl,
                p.RedeemCode,
                p.Stock,
                p.IsActive,
                p.CreatedAt,
                p.UpdatedAt
            ))
            .FirstOrDefaultAsync();
    }
    
    public async Task<ProductAdminDto> CreateAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            ImageUrl = dto.ImageUrl,
            DownloadUrl = dto.DownloadUrl,
            RedeemCode = dto.RedeemCode,
            Stock = dto.Stock,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("商品已创建: {ProductId} - {ProductName}", product.Id, product.Name);
        
        return new ProductAdminDto(
            product.Id,
            product.Name,
            product.Description,
            product.Price,
            product.ImageUrl,
            product.DownloadUrl,
            product.RedeemCode,
            product.Stock,
            product.IsActive,
            product.CreatedAt,
            product.UpdatedAt
        );
    }
    
    public async Task<bool> UpdateAsync(int id, UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return false;
        
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.ImageUrl = dto.ImageUrl;
        product.DownloadUrl = dto.DownloadUrl;
        product.RedeemCode = dto.RedeemCode;
        product.Stock = dto.Stock;
        product.IsActive = dto.IsActive;
        product.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("商品已更新: {ProductId} - {ProductName}", product.Id, product.Name);
        
        return true;
    }
    
    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return false;
        
        try
        {
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("商品已删除: {ProductId} - {ProductName}", id, product.Name);
            return true;
        }
        catch (DbUpdateException ex)
        {
            // 有订单关联时无法删除
            _logger.LogWarning(ex, "删除商品失败（可能有订单关联）: {ProductId}", id);
            return false;
        }
    }
}
