// ============================================================================
// backend.Tests/Services/PresenceServiceTests.cs - PresenceService 单元测试
// ============================================================================
// 测试用户状态服务的核心功能：获取状态、更新状态、手动覆盖管理。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// PresenceService 单元测试
/// </summary>
public class PresenceServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _memoryCache;
    private readonly Mock<ILogger<PresenceService>> _loggerMock;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly PresenceService _service;

    public PresenceServiceTests()
    {
        // 1. 配置 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        
        // 2. 配置 MemoryCache
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        
        // 3. 配置 Logger Mock
        _loggerMock = new Mock<ILogger<PresenceService>>();
        
        // 4. 配置 ServiceScopeFactory（用于获取 ISiteContentService）
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddSingleton(_context);
        serviceCollection.AddScoped<ISiteContentService, SiteContentService>();
        var serviceProvider = serviceCollection.BuildServiceProvider();
        _scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
        
        // 5. 创建被测试服务
        _service = new PresenceService(_memoryCache, _scopeFactory, _loggerMock.Object);
    }

    public void Dispose()
    {
        _context.Dispose();
        _memoryCache.Dispose();
    }

    // ========== GetCurrentStatus 测试 ==========

    [Fact]
    public void GetCurrentStatus_ShouldReturnCachedStatus_WhenCacheExists()
    {
        // Arrange
        var cachedStatus = new UserPresenceDto(
            Status: "gaming",
            Icon: "Gamepad2",
            Message: "正在游玩 Elden Ring",
            Details: null,
            Timestamp: DateTime.UtcNow
        );
        _memoryCache.Set("user_presence", cachedStatus, TimeSpan.FromMinutes(5));

        // Act
        var result = _service.GetCurrentStatus();

        // Assert
        result.Status.Should().Be("gaming");
        result.Message.Should().Be("正在游玩 Elden Ring");
    }

    [Fact]
    public void GetCurrentStatus_ShouldReturnDefaultOffline_WhenCacheEmpty()
    {
        // Act (缓存为空，不设置任何值)
        var result = _service.GetCurrentStatus();

        // Assert
        result.Status.Should().Be("offline");
        result.Icon.Should().Be("Moon");
        result.Message.Should().Be("当前离线");
    }

    // ========== UpdateStatus 测试 ==========

    [Fact]
    public void UpdateStatus_ShouldSetCacheCorrectly()
    {
        // Arrange
        var newStatus = new UserPresenceDto(
            Status: "coding",
            Icon: "Code",
            Message: "正在编程",
            Details: "VS Code",
            Timestamp: DateTime.UtcNow
        );

        // Act
        _service.UpdateStatus(newStatus);

        // Assert
        _memoryCache.TryGetValue<UserPresenceDto>("user_presence", out var cachedStatus);
        cachedStatus.Should().NotBeNull();
        cachedStatus!.Status.Should().Be("coding");
        cachedStatus.Message.Should().Be("正在编程");
    }

    // ========== SetOverrideAsync 测试 ==========

    [Fact]
    public async Task SetOverrideAsync_ShouldPersistToDatabase()
    {
        // Act
        await _service.SetOverrideAsync("busy", "Meeting", DateTime.UtcNow.AddHours(2));

        // Assert - 检查数据库
        var content = await _context.SiteContents
            .FirstOrDefaultAsync(c => c.Key == "config_presence_override");
        
        content.Should().NotBeNull();
        content!.Value.Should().Contain("busy");
        content.Value.Should().Contain("message");  // 检查 JSON 结构
        content.Value.Should().Contain("expireAt"); // 检查过期时间字段
    }

    [Fact]
    public async Task SetOverrideAsync_ShouldUpdateCacheImmediately()
    {
        // Act
        await _service.SetOverrideAsync("traveling", "出差中", null);

        // Assert - 检查缓存
        var cachedStatus = _service.GetCurrentStatus();
        cachedStatus.Status.Should().Be("traveling");
        cachedStatus.Message.Should().Be("出差中");
        cachedStatus.Icon.Should().Be("Sparkles");
    }

    [Fact]
    public async Task SetOverrideAsync_ShouldThrowException_WhenStatusTooLong()
    {
        // Arrange
        var longStatus = new string('a', 51); // 超过 50 字符

        // Act
        Func<Task> act = () => _service.SetOverrideAsync(longStatus, "消息", null);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*状态标识最长 50 字符*");
    }

    [Fact]
    public async Task SetOverrideAsync_ShouldThrowException_WhenMessageTooLong()
    {
        // Arrange
        var longMessage = new string('a', 201); // 超过 200 字符

        // Act
        Func<Task> act = () => _service.SetOverrideAsync("busy", longMessage, null);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*消息最长 200 字符*");
    }

    // ========== GetOverrideAsync 测试 ==========

    [Fact]
    public async Task GetOverrideAsync_ShouldReturnNull_WhenNoOverrideExists()
    {
        // Act
        var result = await _service.GetOverrideAsync();

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetOverrideAsync_ShouldReturnNull_WhenOverrideExpired()
    {
        // Arrange - 设置一个已过期的覆盖
        var expiredOverride = new SiteContent
        {
            Key = "config_presence_override",
            Value = "{\"status\":\"busy\",\"message\":\"测试\",\"expireAt\":\"2020-01-01T00:00:00Z\"}",
            Description = "测试"
        };
        _context.SiteContents.Add(expiredOverride);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetOverrideAsync();

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetOverrideAsync_ShouldReturnStatus_WhenValidOverrideExists()
    {
        // Arrange - 设置一个未过期的覆盖
        var futureDate = DateTime.UtcNow.AddDays(1).ToString("O");
        var validOverride = new SiteContent
        {
            Key = "config_presence_override",
            Value = $"{{\"status\":\"busy\",\"message\":\"会议中\",\"expireAt\":\"{futureDate}\"}}",
            Description = "测试"
        };
        _context.SiteContents.Add(validOverride);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetOverrideAsync();

        // Assert
        result.Should().NotBeNull();
        result!.Status.Should().Be("busy");
        result.Message.Should().Be("会议中");
    }

    [Fact]
    public async Task GetOverrideAsync_ShouldReturnNull_WhenJsonInvalid()
    {
        // Arrange - 设置无效 JSON
        var invalidJson = new SiteContent
        {
            Key = "config_presence_override",
            Value = "not valid json {{",
            Description = "测试"
        };
        _context.SiteContents.Add(invalidJson);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetOverrideAsync();

        // Assert
        result.Should().BeNull();
    }

    // ========== ClearOverrideAsync 测试 ==========

    [Fact]
    public async Task ClearOverrideAsync_ShouldSetEmptyJson()
    {
        // Arrange - 先设置一个覆盖
        await _service.SetOverrideAsync("busy", "会议中", null);

        // Act
        await _service.ClearOverrideAsync();

        // Assert - 检查数据库
        var content = await _context.SiteContents
            .FirstOrDefaultAsync(c => c.Key == "config_presence_override");
        
        content.Should().NotBeNull();
        content!.Value.Should().Be("{}");
    }
}
