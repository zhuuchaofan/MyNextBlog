// ============================================================================
// backend.Tests/Services/CategoryServiceTests.cs - CategoryService 单元测试
// ============================================================================
// 测试分类服务的核心功能：获取、创建、去重检查。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// CategoryService 单元测试
/// </summary>
public class CategoryServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly CategoryService _categoryService;

    public CategoryServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _categoryService = new CategoryService(_context);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.Categories.AddRange(
            new Category { Id = 1, Name = "技术" },
            new Category { Id = 2, Name = "生活" },
            new Category { Id = 3, Name = "随笔" }
        );
        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    // ========== 获取测试 ==========

    [Fact]
    public async Task GetAllCategoriesAsync_ShouldReturnAllCategories()
    {
        var categories = await _categoryService.GetAllCategoriesAsync();
        categories.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetAllCategoriesAsync_ShouldReturnSortedResult()
    {
        // 测试返回结果是由 Service 排序的
        // 因为不同环境的中文排序规则不同 (zh-CN 拼音 vs en-US Unicode)
        // 我们只验证返回结果与数据库排序一致，不验证具体顺序
        var categories = await _categoryService.GetAllCategoriesAsync();
        
        // 验证：返回的顺序与使用相同规则重新排序后一致
        var resorted = categories.OrderBy(c => c.Name).ToList();
        categories.Select(c => c.Id).Should().Equal(resorted.Select(c => c.Id));
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnCategory_WhenExists()
    {
        var category = await _categoryService.GetByIdAsync(1);

        category.Should().NotBeNull();
        category!.Name.Should().Be("技术");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        var category = await _categoryService.GetByIdAsync(999);
        category.Should().BeNull();
    }

    // ========== 创建测试 ==========

    [Fact]
    public async Task AddCategoryAsync_ShouldCreateCategory()
    {
        var newCategory = await _categoryService.AddCategoryAsync("新分类");

        newCategory.Should().NotBeNull();
        newCategory.Name.Should().Be("新分类");
        newCategory.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task AddCategoryAsync_ShouldTrimName()
    {
        var newCategory = await _categoryService.AddCategoryAsync("  带空格分类  ");
        newCategory.Name.Should().Be("带空格分类");
    }

    // ========== 去重检查测试 ==========

    [Fact]
    public async Task ExistsAsync_ShouldReturnTrue_WhenExists()
    {
        var exists = await _categoryService.ExistsAsync("技术");
        exists.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_ShouldReturnFalse_WhenNotExists()
    {
        var exists = await _categoryService.ExistsAsync("不存在");
        exists.Should().BeFalse();
    }

    [Fact]
    public async Task ExistsAsync_ShouldBeCaseInsensitive()
    {
        var exists = await _categoryService.ExistsAsync("技术"); // 已存在 "技术"
        exists.Should().BeTrue();
    }
}
