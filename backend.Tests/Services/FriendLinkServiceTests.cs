// ============================================================================
// backend.Tests/Services/FriendLinkServiceTests.cs - FriendLinkService 单元测试
// ============================================================================
// 测试友链服务的核心功能：获取、创建、更新、删除、缓存。

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
/// FriendLinkService 单元测试
/// </summary>
public class FriendLinkServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly FriendLinkService _friendLinkService;

    public FriendLinkServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _cache = new MemoryCache(new MemoryCacheOptions());
        var loggerMock = new Mock<ILogger<FriendLinkService>>();
        
        _friendLinkService = new FriendLinkService(_context, _cache, loggerMock.Object);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.FriendLinks.AddRange(
            new FriendLink 
            { 
                Id = 1, 
                Name = "张三的博客", 
                Url = "https://zhangsan.com",
                Description = "技术分享",
                IsActive = true,
                IsOnline = true,
                DisplayOrder = 1,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new FriendLink 
            { 
                Id = 2, 
                Name = "李四的站点", 
                Url = "https://lisi.com",
                IsActive = true,
                IsOnline = false,
                DisplayOrder = 2,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            },
            new FriendLink 
            { 
                Id = 3, 
                Name = "王五 (禁用)", 
                Url = "https://wangwu.com",
                IsActive = false,  // 禁用的友链
                DisplayOrder = 3,
                CreatedAt = DateTime.UtcNow
            }
        );
        _context.SaveChanges();
    }

    public void Dispose() 
    {
        _cache.Dispose();
        _context.Dispose();
    }

    // ========== 公开 API 测试 ==========

    [Fact]
    public async Task GetAllActiveAsync_ShouldReturnOnlyActiveLinks()
    {
        var links = await _friendLinkService.GetAllActiveAsync();
        
        links.Should().HaveCount(2);
        links.Should().OnlyContain(l => l.Id != 3); // 不含禁用的
    }

    [Fact]
    public async Task GetAllActiveAsync_ShouldBeSortedByDisplayOrder()
    {
        var links = await _friendLinkService.GetAllActiveAsync();
        
        links.Select(l => l.DisplayOrder).Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task GetAllActiveAsync_ShouldUseCache()
    {
        // 第一次调用：从数据库加载
        var links1 = await _friendLinkService.GetAllActiveAsync();
        
        // 修改数据库（但缓存未失效）
        var dbLink = await _context.FriendLinks.FindAsync(1);
        dbLink!.Name = "修改后的名称";
        await _context.SaveChangesAsync();
        
        // 第二次调用：应该返回缓存数据
        var links2 = await _friendLinkService.GetAllActiveAsync();
        
        // 缓存中的数据应该还是原来的
        links2.First(l => l.Id == 1).Name.Should().Be("张三的博客");
    }

    // ========== 管理员 API 测试 ==========

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllLinks_IncludingInactive()
    {
        var links = await _friendLinkService.GetAllAsync();
        
        links.Should().HaveCount(3);
        links.Should().Contain(l => l.Id == 3); // 包含禁用的
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnLink_WhenExists()
    {
        var link = await _friendLinkService.GetByIdAsync(1);
        
        link.Should().NotBeNull();
        link!.Name.Should().Be("张三的博客");
        link.Url.Should().Be("https://zhangsan.com");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        var link = await _friendLinkService.GetByIdAsync(999);
        
        link.Should().BeNull();
    }

    // ========== 创建测试 ==========

    [Fact]
    public async Task CreateAsync_ShouldCreateLink()
    {
        var dto = new CreateFriendLinkDto(
            Name: "新友链",
            Url: "https://newfriend.com",
            Description: "描述",
            AvatarUrl: null,
            DisplayOrder: 10
        );
        
        var result = await _friendLinkService.CreateAsync(dto);
        
        result.Should().NotBeNull();
        result.Name.Should().Be("新友链");
        result.Id.Should().BeGreaterThan(0);
        result.IsActive.Should().BeTrue(); // 默认启用
    }

    [Fact]
    public async Task CreateAsync_ShouldTrimNameAndUrl()
    {
        var dto = new CreateFriendLinkDto(
            Name: "  带空格的名称  ",
            Url: "  https://example.com  ",
            Description: null,
            AvatarUrl: null,
            DisplayOrder: 0
        );
        
        var result = await _friendLinkService.CreateAsync(dto);
        
        result.Name.Should().Be("带空格的名称");
        result.Url.Should().Be("https://example.com");
    }

    [Fact]
    public async Task CreateAsync_ShouldInvalidateCache()
    {
        // 预热缓存
        await _friendLinkService.GetAllActiveAsync();
        
        // 创建新链接
        var dto = new CreateFriendLinkDto("测试", "https://test.com", null, null, 0);
        await _friendLinkService.CreateAsync(dto);
        
        // 再次获取应该包含新链接
        var links = await _friendLinkService.GetAllActiveAsync();
        links.Should().Contain(l => l.Name == "测试");
    }

    // ========== 更新测试 ==========

    [Fact]
    public async Task UpdateAsync_ShouldUpdateLink()
    {
        var dto = new UpdateFriendLinkDto(
            Name: "更新后的名称",
            Url: "https://updated.com",
            Description: "新描述",
            AvatarUrl: null,
            DisplayOrder: 100,
            IsActive: true
        );
        
        var result = await _friendLinkService.UpdateAsync(1, dto);
        
        result.Should().NotBeNull();
        result!.Name.Should().Be("更新后的名称");
        result.Url.Should().Be("https://updated.com");
        result.DisplayOrder.Should().Be(100);
    }

    [Fact]
    public async Task UpdateAsync_ShouldReturnNull_WhenNotExists()
    {
        var dto = new UpdateFriendLinkDto("x", "https://x.com", null, null, 0, true);
        
        var result = await _friendLinkService.UpdateAsync(999, dto);
        
        result.Should().BeNull();
    }

    // ========== 删除测试 ==========

    [Fact]
    public async Task DeleteAsync_ShouldDeleteLink()
    {
        var result = await _friendLinkService.DeleteAsync(2);
        
        result.Should().BeTrue();
        
        var deleted = await _context.FriendLinks.FindAsync(2);
        deleted.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenNotExists()
    {
        var result = await _friendLinkService.DeleteAsync(999);
        
        result.Should().BeFalse();
    }

    // ========== 健康状态更新测试 ==========

    [Fact]
    public async Task UpdateHealthStatusAsync_ShouldUpdateStatus()
    {
        await _friendLinkService.UpdateHealthStatusAsync(1, false, 500);
        
        var link = await _context.FriendLinks.FindAsync(1);
        link!.IsOnline.Should().BeFalse();
        link.LatencyMs.Should().Be(500);
        link.LastCheckTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }
}
