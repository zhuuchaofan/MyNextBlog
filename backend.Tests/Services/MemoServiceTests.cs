// ============================================================================
// backend.Tests/Services/MemoServiceTests.cs - MemoService 单元测试
// ============================================================================
// 测试 Memo 服务的核心功能：Keyset Pagination、CRUD、热力图。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// MemoService 单元测试
/// </summary>
public class MemoServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly MemoService _memoService;

    public MemoServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _cache = new MemoryCache(new MemoryCacheOptions());
        var loggerMock = new Mock<ILogger<MemoService>>();
        
        _memoService = new MemoService(_context, _cache, loggerMock.Object);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 创建测试数据：5 条公开 + 1 条私密
        var now = DateTime.UtcNow;
        _context.Memos.AddRange(
            new Memo 
            { 
                Id = 1, 
                Content = "第一条公开动态", 
                IsPublic = true,
                Source = "Web",
                ImageUrls = [],
                CreatedAt = now.AddDays(-5)
            },
            new Memo 
            { 
                Id = 2, 
                Content = "第二条公开动态", 
                IsPublic = true,
                Source = "API",
                ImageUrls = ["https://example.com/img1.jpg"],
                CreatedAt = now.AddDays(-4)
            },
            new Memo 
            { 
                Id = 3, 
                Content = "第三条公开动态", 
                IsPublic = true,
                Source = "Web",
                ImageUrls = [],
                CreatedAt = now.AddDays(-3)
            },
            new Memo 
            { 
                Id = 4, 
                Content = "私密动态", 
                IsPublic = false,  // 私密
                Source = "Web",
                ImageUrls = [],
                CreatedAt = now.AddDays(-2)
            },
            new Memo 
            { 
                Id = 5, 
                Content = "第四条公开动态", 
                IsPublic = true,
                Source = "Shortcut",
                ImageUrls = [],
                CreatedAt = now.AddDays(-1)
            },
            new Memo 
            { 
                Id = 6, 
                Content = "最新公开动态", 
                IsPublic = true,
                Source = "Web",
                ImageUrls = [],
                CreatedAt = now
            }
        );
        _context.SaveChanges();
    }

    public void Dispose() 
    {
        _cache.Dispose();
        _context.Dispose();
    }

    // ========== Keyset Pagination 测试 ==========

    [Fact]
    public async Task GetPublicMemosAsync_ShouldReturnOnlyPublicMemos()
    {
        var result = await _memoService.GetPublicMemosAsync(null, 50);
        
        result.Items.Should().HaveCount(5); // 6 条 - 1 条私密 = 5 条
        result.Items.Should().OnlyContain(m => m.Id != 4);
    }

    [Fact]
    public async Task GetPublicMemosAsync_ShouldBeSortedByCreatedAtDesc()
    {
        var result = await _memoService.GetPublicMemosAsync(null, 50);
        
        result.Items.Select(m => m.CreatedAt).Should().BeInDescendingOrder();
    }

    [Fact]
    public async Task GetPublicMemosAsync_ShouldRespectLimit()
    {
        var result = await _memoService.GetPublicMemosAsync(null, 2);
        
        result.Items.Should().HaveCount(2);
        result.NextCursor.Should().NotBeNull(); // 还有更多
    }

    [Fact]
    public async Task GetPublicMemosAsync_ShouldReturnNullCursor_WhenNoMoreData()
    {
        var result = await _memoService.GetPublicMemosAsync(null, 50);
        
        result.NextCursor.Should().BeNull(); // 没有更多了
    }

    [Fact]
    public async Task GetPublicMemosAsync_ShouldHandlePagination()
    {
        // 第一页
        var page1 = await _memoService.GetPublicMemosAsync(null, 2);
        page1.Items.Should().HaveCount(2);
        page1.NextCursor.Should().NotBeNull();
        
        // 第二页
        var page2 = await _memoService.GetPublicMemosAsync(page1.NextCursor, 2);
        page2.Items.Should().HaveCount(2);
        
        // 验证不重复 (Keyset Pagination 核心)
        page1.Items.Select(m => m.Id).Should().NotIntersectWith(page2.Items.Select(m => m.Id));
    }

    [Fact]
    public async Task GetPublicMemosAsync_ShouldIgnoreInvalidCursor()
    {
        var result = await _memoService.GetPublicMemosAsync("invalid-cursor", 50);
        
        // 无效游标应该被忽略，返回第一页
        result.Items.Should().HaveCount(5);
    }

    // ========== 管理员 API 测试 ==========

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllMemos_IncludingPrivate()
    {
        var memos = await _memoService.GetAllAsync(1, 50);
        
        memos.Should().HaveCount(6); // 包含私密
        memos.Should().Contain(m => m.Id == 4);
    }

    [Fact]
    public async Task GetCountAsync_ShouldReturnCorrectCount()
    {
        var publicCount = await _memoService.GetCountAsync(includePrivate: false);
        var totalCount = await _memoService.GetCountAsync(includePrivate: true);
        
        publicCount.Should().Be(5);
        totalCount.Should().Be(6);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnMemo_WhenExists()
    {
        var memo = await _memoService.GetByIdAsync(2);
        
        memo.Should().NotBeNull();
        memo!.Content.Should().Be("第二条公开动态");
        memo.Source.Should().Be("API");
        memo.ImageUrls.Should().Contain("https://example.com/img1.jpg");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        var memo = await _memoService.GetByIdAsync(999);
        
        memo.Should().BeNull();
    }

    // ========== 创建测试 ==========

    [Fact]
    public async Task CreateAsync_ShouldCreateMemo()
    {
        var dto = new CreateMemoDto(
            Content: "新动态内容",
            ImageUrls: ["https://img.com/1.jpg", "https://img.com/2.jpg"],
            Source: "Test",
            IsPublic: true
        );
        
        var result = await _memoService.CreateAsync(dto);
        
        result.Should().NotBeNull();
        result.Content.Should().Be("新动态内容");
        result.ImageUrls.Should().HaveCount(2);
        result.Source.Should().Be("Test");
    }

    [Fact]
    public async Task CreateAsync_ShouldTrimContent()
    {
        var dto = new CreateMemoDto(
            Content: "  带空格的内容  ",
            ImageUrls: null,
            Source: "Web",
            IsPublic: true
        );
        
        var result = await _memoService.CreateAsync(dto);
        
        result.Content.Should().Be("带空格的内容");
    }

    [Fact]
    public async Task CreateAsync_ShouldLimitImageUrlsTo9()
    {
        var imageUrls = Enumerable.Range(1, 15).Select(i => $"https://img.com/{i}.jpg").ToList();
        var dto = new CreateMemoDto("内容", imageUrls, "Web", true);
        
        var result = await _memoService.CreateAsync(dto);
        
        result.ImageUrls.Should().HaveCount(9);
    }

    // ========== 更新测试 ==========

    [Fact]
    public async Task UpdateAsync_ShouldUpdateMemo()
    {
        var dto = new UpdateMemoDto(
            Content: "更新后的内容",
            ImageUrls: ["https://new.jpg"],
            IsPublic: false
        );
        
        var result = await _memoService.UpdateAsync(1, dto);
        
        result.Should().NotBeNull();
        result!.Content.Should().Be("更新后的内容");
        result.IsPublic.Should().BeFalse();
        result.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateAsync_ShouldReturnNull_WhenNotExists()
    {
        var dto = new UpdateMemoDto("x", null, true);
        
        var result = await _memoService.UpdateAsync(999, dto);
        
        result.Should().BeNull();
    }

    // ========== 删除测试 ==========

    [Fact]
    public async Task DeleteAsync_ShouldDeleteMemo()
    {
        var result = await _memoService.DeleteAsync(3);
        
        result.Should().BeTrue();
        
        var deleted = await _context.Memos.FindAsync(3);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenNotExists()
    {
        var result = await _memoService.DeleteAsync(999);
        
        result.Should().BeFalse();
    }

    // ========== 热力图测试 ==========

    [Fact]
    public async Task GetHeatmapDataAsync_ShouldReturnGroupedData()
    {
        var year = DateTime.UtcNow.Year;
        var data = await _memoService.GetHeatmapDataAsync(year);
        
        data.Should().NotBeEmpty();
        data.Values.Sum().Should().Be(5); // 5 条公开动态
    }
}
