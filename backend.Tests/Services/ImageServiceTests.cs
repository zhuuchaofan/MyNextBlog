// ============================================================================
// backend.Tests/Services/ImageServiceTests.cs - ImageService 单元测试
// ============================================================================
// 测试图片服务的核心功能：记录、关联、清理。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// ImageService 单元测试
/// </summary>
public class ImageServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ImageService _service;
    private readonly Mock<IStorageService> _mockStorageService;
    private readonly Mock<ILogger<ImageService>> _mockLogger;

    public ImageServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _mockStorageService = new Mock<IStorageService>();
        _mockLogger = new Mock<ILogger<ImageService>>();
        
        _service = new ImageService(_context, _mockStorageService.Object, _mockLogger.Object);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 创建测试用户和文章
        _context.Users.Add(new User { Id = 1, Username = "test", PasswordHash = "hash", Email = "test@test.com" });
        _context.Posts.Add(new Post { Id = 1, Title = "测试文章", Content = "内容包含 https://r2.example.com/image1.jpg", UserId = 1 });
        
        // 创建测试图片资源
        _context.ImageAssets.AddRange(
            new ImageAsset { Id = 1, Url = "https://r2.example.com/image1.jpg", StorageKey = "images/1.jpg", PostId = null, UploadTime = DateTime.UtcNow.AddHours(-1) },
            new ImageAsset { Id = 2, Url = "https://r2.example.com/image2.jpg", StorageKey = "images/2.jpg", PostId = 1, UploadTime = DateTime.UtcNow.AddDays(-2) },
            new ImageAsset { Id = 3, Url = "https://r2.example.com/orphan.jpg", StorageKey = "images/orphan.jpg", PostId = null, UploadTime = DateTime.UtcNow.AddDays(-2) } // 僵尸图片
        );
        
        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    // ========== 记录图片测试 ==========

    [Fact]
    public async Task RecordImageAsync_ShouldCreateImageAsset()
    {
        // Arrange
        var countBefore = await _context.ImageAssets.CountAsync();

        // Act
        await _service.RecordImageAsync("https://r2.example.com/new.jpg", "images/new.jpg", 800, 600);

        // Assert
        var countAfter = await _context.ImageAssets.CountAsync();
        countAfter.Should().Be(countBefore + 1);
    }

    [Fact]
    public async Task RecordImageAsync_ShouldSetPostIdToNull()
    {
        // Act
        await _service.RecordImageAsync("https://r2.example.com/new.jpg", "images/new.jpg", 800, 600);

        // Assert
        var image = await _context.ImageAssets.FirstAsync(i => i.StorageKey == "images/new.jpg");
        image.PostId.Should().BeNull(); // 游离态
    }

    // ========== 关联图片测试 ==========

    [Fact]
    public async Task AssociateImagesAsync_ShouldAssociateMatchingImages()
    {
        // Arrange (image1 的 URL 在 content 中)
        var content = "文章内容 https://r2.example.com/image1.jpg 结束";

        // Act
        await _service.AssociateImagesAsync(1, content);

        // Assert
        var image = await _context.ImageAssets.FindAsync(1);
        image!.PostId.Should().Be(1);
    }

    [Fact]
    public async Task AssociateImagesAsync_ShouldNotAssociateUnmatchedImages()
    {
        // Arrange (不包含任何图片 URL)
        var content = "不包含任何图片的文章内容";

        // Act
        await _service.AssociateImagesAsync(1, content);

        // Assert
        var image = await _context.ImageAssets.FindAsync(1);
        image!.PostId.Should().BeNull(); // 仍然是游离态
    }

    [Fact]
    public async Task AssociateImagesAsync_ShouldHandleEmptyContent()
    {
        // Act & Assert (不应抛异常)
        await _service.AssociateImagesAsync(1, "");
        await _service.AssociateImagesAsync(1, null!);
    }

    // ========== 删除文章图片测试 ==========

    [Fact]
    public async Task DeleteImagesForPostAsync_ShouldRemoveImages()
    {
        // Arrange (image2 属于 post 1)
        _mockStorageService.Setup(s => s.DeleteAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        // Act
        await _service.DeleteImagesForPostAsync(1);

        // Assert
        var image = await _context.ImageAssets.FindAsync(2);
        image.Should().BeNull(); // 已删除
    }

    [Fact]
    public async Task DeleteImagesForPostAsync_ShouldCallStorageDelete()
    {
        // Arrange
        _mockStorageService.Setup(s => s.DeleteAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        // Act
        await _service.DeleteImagesForPostAsync(1);

        // Assert
        _mockStorageService.Verify(s => s.DeleteAsync("images/2.jpg"), Times.Once);
    }

    // ========== 清理僵尸图片测试 ==========

    [Fact]
    public async Task CleanupOrphanedImagesAsync_ShouldRemoveOrphanedImages()
    {
        // Arrange (image3 是僵尸图片)
        _mockStorageService.Setup(s => s.DeleteAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        // Act
        var count = await _service.CleanupOrphanedImagesAsync();

        // Assert
        count.Should().BeGreaterThan(0);
        var orphan = await _context.ImageAssets.FindAsync(3);
        orphan.Should().BeNull();
    }

    [Fact]
    public async Task CleanupOrphanedImagesAsync_ShouldNotRemoveRecentImages()
    {
        // image1 虽然 PostId = null，但上传时间不到 24 小时
        _mockStorageService.Setup(s => s.DeleteAsync(It.IsAny<string>())).Returns(Task.CompletedTask);

        // Act
        await _service.CleanupOrphanedImagesAsync();

        // Assert
        var image = await _context.ImageAssets.FindAsync(1);
        image.Should().NotBeNull(); // 不应被清理
    }
}
