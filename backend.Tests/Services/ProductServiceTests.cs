// ============================================================================
// backend.Tests/Services/ProductServiceTests.cs - ProductService 单元测试
// ============================================================================
// 测试 ProductService 的核心功能：商品 CRUD、库存管理。
// 使用 EF Core InMemory 数据库模拟真实环境。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// ProductService 单元测试
/// </summary>
public class ProductServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ProductService _productService;
    private readonly Mock<ILogger<ProductService>> _mockLogger;

    public ProductServiceTests()
    {
        // 创建 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _mockLogger = new Mock<ILogger<ProductService>>();
        
        _productService = new ProductService(_context, _mockLogger.Object);
        
        // 播种测试数据
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 创建测试商品
        _context.Products.AddRange(
            new Product
            {
                Id = 1,
                Name = "电子书 A",
                Description = "这是电子书 A 的描述",
                Price = 29.99m,
                Stock = 100,
                IsActive = true,
                DownloadUrl = "https://example.com/ebook-a.pdf",
                RedeemCode = "EBOOK-A-123"
            },
            new Product
            {
                Id = 2,
                Name = "电子书 B",
                Description = "这是电子书 B 的描述",
                Price = 19.99m,
                Stock = 0, // 已售罄
                IsActive = true,
                DownloadUrl = "https://example.com/ebook-b.pdf"
            },
            new Product
            {
                Id = 3,
                Name = "下架商品",
                Description = "这是已下架的商品",
                Price = 9.99m,
                Stock = 50,
                IsActive = false
            },
            new Product
            {
                Id = 4,
                Name = "无限库存商品",
                Description = "虚拟商品",
                Price = 49.99m,
                Stock = -1, // 无限库存
                IsActive = true
            }
        );

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    // ========== 公开 API 测试 ==========

    [Fact]
    public async Task GetAllActiveAsync_ShouldReturnOnlyActiveProducts()
    {
        // Act
        var products = await _productService.GetAllActiveAsync();

        // Assert
        products.Should().HaveCount(3); // 只有 3 个上架商品
        products.Should().AllSatisfy(p => p.IsActive.Should().BeTrue());
    }

    [Fact]
    public async Task GetAllActiveAsync_ShouldNotIncludeSensitiveInfo()
    {
        // Act
        var products = await _productService.GetAllActiveAsync();

        // Assert
        // ProductDto 只有公开字段
        products.Should().AllSatisfy(p =>
        {
            p.Id.Should().BeGreaterThan(0);
            p.Name.Should().NotBeEmpty();
        });
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnProduct_WhenActiveAndExists()
    {
        // Act
        var product = await _productService.GetByIdAsync(1);

        // Assert
        product.Should().NotBeNull();
        product!.Name.Should().Be("电子书 A");
        product.Price.Should().Be(29.99m);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotActive()
    {
        // Act (商品 3 已下架)
        var product = await _productService.GetByIdAsync(3);

        // Assert
        product.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var product = await _productService.GetByIdAsync(999);

        // Assert
        product.Should().BeNull();
    }

    // ========== 管理员 API 测试 ==========

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllProducts()
    {
        // Act
        var products = await _productService.GetAllAsync();

        // Assert
        products.Should().HaveCount(4); // 包括下架商品
    }

    [Fact]
    public async Task GetAllAsync_ShouldIncludeSensitiveInfo()
    {
        // Act
        var products = await _productService.GetAllAsync();

        // Assert
        var ebookA = products.First(p => p.Id == 1);
        ebookA.DownloadUrl.Should().Be("https://example.com/ebook-a.pdf");
        ebookA.RedeemCode.Should().Be("EBOOK-A-123");
    }

    [Fact]
    public async Task GetAdminByIdAsync_ShouldReturnProduct_EvenIfNotActive()
    {
        // Act
        var product = await _productService.GetAdminByIdAsync(3);

        // Assert
        product.Should().NotBeNull();
        product!.IsActive.Should().BeFalse();
    }

    // ========== 创建商品测试 ==========

    [Fact]
    public async Task CreateAsync_ShouldCreateProduct()
    {
        // Arrange
        var dto = new CreateProductDto(
            Name: "新商品",
            Description: "新商品描述",
            Price: 39.99m,
            ImageUrl: "https://example.com/image.jpg",
            DownloadUrl: "https://example.com/download",
            RedeemCode: "NEW-CODE",
            Stock: 50
        );

        // Act
        var product = await _productService.CreateAsync(dto);

        // Assert
        product.Should().NotBeNull();
        product.Id.Should().BeGreaterThan(0);
        product.Name.Should().Be("新商品");
        product.Price.Should().Be(39.99m);
        product.IsActive.Should().BeTrue(); // 默认上架
    }

    [Fact]
    public async Task CreateAsync_ShouldDefaultToInfiniteStock_WhenNotSpecified()
    {
        // Arrange - 使用默认 Stock = -1
        var dto = new CreateProductDto(
            Name: "虚拟商品",
            Description: "无限库存",
            Price: 9.99m,
            ImageUrl: null,
            DownloadUrl: null,
            RedeemCode: null
            // Stock 使用默认值 -1
        );

        // Act
        var product = await _productService.CreateAsync(dto);

        // Assert
        product.Stock.Should().Be(-1); // 默认无限库存
    }

    // ========== 更新商品测试 ==========

    [Fact]
    public async Task UpdateAsync_ShouldUpdateFields()
    {
        // Arrange
        var dto = new UpdateProductDto(
            Name: "更新后的名称",
            Description: "更新后的描述",
            Price: 99.99m,
            ImageUrl: null,
            DownloadUrl: "https://new-url.com",
            RedeemCode: "NEW-CODE",
            Stock: 200,
            IsActive: false
        );

        // Act
        var success = await _productService.UpdateAsync(1, dto);

        // Assert
        success.Should().BeTrue();
        
        var product = await _context.Products.FindAsync(1);
        product!.Name.Should().Be("更新后的名称");
        product.Price.Should().Be(99.99m);
        product.Stock.Should().Be(200);
        product.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateAsync_ShouldReturnFalse_WhenNotExists()
    {
        // Arrange
        var dto = new UpdateProductDto("名称", "描述", 10m, null, null, null, 10, true);

        // Act
        var success = await _productService.UpdateAsync(999, dto);

        // Assert
        success.Should().BeFalse();
    }

    // ========== 删除商品测试 ==========

    [Fact]
    public async Task DeleteAsync_ShouldDeleteProduct()
    {
        // Act
        var success = await _productService.DeleteAsync(4);

        // Assert
        success.Should().BeTrue();
        var product = await _context.Products.FindAsync(4);
        product.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenNotExists()
    {
        // Act
        var success = await _productService.DeleteAsync(999);

        // Assert
        success.Should().BeFalse();
    }
}
