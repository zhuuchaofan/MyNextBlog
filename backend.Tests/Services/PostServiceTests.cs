// ============================================================================
// backend.Tests/Services/PostServiceTests.cs - PostService 单元测试
// ============================================================================
// 测试 PostService 的核心功能：分页、创建、更新。
// 使用 EF Core InMemory 数据库模拟真实环境。

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
/// PostService 单元测试
/// </summary>
public class PostServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly PostService _postService;
    private readonly Mock<IImageService> _mockImageService;
    private readonly Mock<ITagService> _mockTagService;
    private readonly Mock<ILogger<PostService>> _mockLogger;
    private readonly IMemoryCache _memoryCache;

    public PostServiceTests()
    {
        // 创建 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _mockImageService = new Mock<IImageService>();
        _mockTagService = new Mock<ITagService>();
        _mockLogger = new Mock<ILogger<PostService>>();
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        
        // PostService 构造函数顺序: (context, imageService, cache, tagService, logger)
        _postService = new PostService(
            _context, 
            _mockImageService.Object, 
            _memoryCache,
            _mockTagService.Object,
            _mockLogger.Object);
        
        // 播种测试数据
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 创建测试用户
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            PasswordHash = "hash",
            Email = "test@test.com"
        };
        _context.Users.Add(user);

        // 创建测试分类
        var category = new Category { Id = 1, Name = "测试分类" };
        _context.Categories.Add(category);

        // 创建测试文章
        for (int i = 1; i <= 15; i++)
        {
            _context.Posts.Add(new Post
            {
                Id = i,
                Title = $"测试文章 {i}",
                Content = $"这是测试文章 {i} 的内容",
                UserId = 1,  // Post 使用 UserId 而非 AuthorId
                CategoryId = 1,
                CreateTime = DateTime.UtcNow.AddDays(-i),
                IsHidden = i > 10, // 后5篇是草稿
                IsDeleted = false
            });
        }

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
        _memoryCache.Dispose();
    }

    // ========== 分页测试 ==========

    [Fact]
    public async Task GetAllPostsAsync_ShouldReturnCorrectPageSize()
    {
        // Arrange
        int page = 1;
        int pageSize = 5;

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(page, pageSize, includeHidden: false);

        // Assert
        posts.Should().HaveCount(5);
        totalCount.Should().Be(10); // 只有10篇公开文章
    }

    [Fact]
    public async Task GetAllPostsAsync_ShouldIncludeHiddenPosts_WhenRequested()
    {
        // Arrange
        int page = 1;
        int pageSize = 20;

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(page, pageSize, includeHidden: true);

        // Assert
        totalCount.Should().Be(15); // 包含所有文章
    }

    [Fact]
    public async Task GetAllPostsAsync_ShouldReturnSecondPage()
    {
        // Arrange
        int page = 2;
        int pageSize = 5;

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(page, pageSize, includeHidden: false);

        // Assert
        posts.Should().HaveCount(5);
    }

    // ========== 获取单篇文章测试 ==========

    [Fact]
    public async Task GetPostByIdAsync_ShouldReturnPost_WhenExists()
    {
        // Act
        var post = await _postService.GetPostByIdAsync(1, includeHidden: false);

        // Assert
        post.Should().NotBeNull();
        post!.Title.Should().Be("测试文章 1");
    }

    [Fact]
    public async Task GetPostByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var post = await _postService.GetPostByIdAsync(999, includeHidden: false);

        // Assert
        post.Should().BeNull();
    }

    [Fact]
    public async Task GetPostByIdAsync_ShouldNotReturnHiddenPost_WhenNotIncluded()
    {
        // Act (文章 11 是隐藏的)
        var post = await _postService.GetPostByIdAsync(11, includeHidden: false);

        // Assert
        post.Should().BeNull();
    }

    [Fact]
    public async Task GetPostByIdAsync_ShouldReturnHiddenPost_WhenIncluded()
    {
        // Act
        var post = await _postService.GetPostByIdAsync(11, includeHidden: true);

        // Assert
        post.Should().NotBeNull();
    }

    // ========== 可见性切换测试 ==========

    [Fact]
    public async Task TogglePostVisibilityAsync_ShouldToggleIsHidden()
    {
        // Arrange
        var postBefore = await _postService.GetPostByIdAsync(1, includeHidden: true);
        var hiddenBefore = postBefore!.IsHidden;

        // Act
        var success = await _postService.TogglePostVisibilityAsync(1);

        // Assert
        success.Should().BeTrue();
        var postAfter = await _postService.GetPostByIdAsync(1, includeHidden: true);
        postAfter!.IsHidden.Should().Be(!hiddenBefore);
    }

    [Fact]
    public async Task TogglePostVisibilityAsync_ShouldReturnFalse_WhenPostNotExists()
    {
        // Act
        var success = await _postService.TogglePostVisibilityAsync(999);

        // Assert
        success.Should().BeFalse();
    }
}
