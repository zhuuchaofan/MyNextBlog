using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace MyNextBlog.Tests;

/// <summary>
/// PostService 单元测试
/// 验证重构后的 GetAllPostsAsync(PostQueryDto) 方法行为正确
/// </summary>
public class PostServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly PostService _postService;
    private readonly IMemoryCache _cache;

    public PostServiceTests()
    {
        // 使用 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        // 创建 Mock 依赖
        var imageServiceMock = new Mock<IImageService>();
        var tagServiceMock = new Mock<ITagService>();
        var loggerMock = new Mock<ILogger<PostService>>();
        _cache = new MemoryCache(new MemoryCacheOptions());

        _postService = new PostService(
            _context,
            imageServiceMock.Object,
            _cache,
            tagServiceMock.Object,
            loggerMock.Object
        );

        // 初始化测试数据
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 添加分类
        var category1 = new Category { Id = 1, Name = "技术" };
        var category2 = new Category { Id = 2, Name = "生活" };
        _context.Categories.AddRange(category1, category2);

        // 添加用户
        var user = new User { Id = 1, Username = "testuser", Nickname = "测试用户", PasswordHash = "hash" };
        _context.Users.Add(user);

        // 添加文章
        var posts = new List<Post>
        {
            new() { Id = 1, Title = "公开文章1", Content = "内容1", CategoryId = 1, UserId = 1, IsHidden = false, IsDeleted = false, CreateTime = DateTime.UtcNow.AddDays(-5) },
            new() { Id = 2, Title = "公开文章2", Content = "内容2", CategoryId = 1, UserId = 1, IsHidden = false, IsDeleted = false, CreateTime = DateTime.UtcNow.AddDays(-4) },
            new() { Id = 3, Title = "隐藏文章", Content = "草稿内容", CategoryId = 1, UserId = 1, IsHidden = true, IsDeleted = false, CreateTime = DateTime.UtcNow.AddDays(-3) },
            new() { Id = 4, Title = "已删除文章", Content = "已删除", CategoryId = 1, UserId = 1, IsHidden = false, IsDeleted = true, CreateTime = DateTime.UtcNow.AddDays(-2) },
            new() { Id = 5, Title = "生活分类文章", Content = "生活内容", CategoryId = 2, UserId = 1, IsHidden = false, IsDeleted = false, CreateTime = DateTime.UtcNow.AddDays(-1) },
            new() { Id = 6, Title = "搜索测试文章", Content = "这是一篇关于 C# 编程的文章", CategoryId = 1, UserId = 1, IsHidden = false, IsDeleted = false, CreateTime = DateTime.UtcNow },
        };
        _context.Posts.AddRange(posts);
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
        _cache.Dispose();
    }

    // === 测试用例 ===

    /// <summary>
    /// 测试默认查询：只返回公开且未删除的文章
    /// </summary>
    [Fact]
    public async Task GetAllPostsAsync_DefaultQuery_ReturnsOnlyPublicPosts()
    {
        // Arrange
        var query = new PostQueryDto(); // 默认参数

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(query);

        // Assert
        Assert.Equal(4, totalCount); // 排除隐藏和已删除的文章
        Assert.DoesNotContain(posts, p => p.Title == "隐藏文章");
        Assert.DoesNotContain(posts, p => p.Title == "已删除文章");
    }

    /// <summary>
    /// 测试包含隐藏文章
    /// </summary>
    [Fact]
    public async Task GetAllPostsAsync_IncludeHidden_ReturnsHiddenPosts()
    {
        // Arrange
        var query = new PostQueryDto(IncludeHidden: true);

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(query);

        // Assert
        Assert.Equal(5, totalCount); // 包含隐藏，但不包含已删除
        Assert.Contains(posts, p => p.Title == "隐藏文章");
        Assert.DoesNotContain(posts, p => p.Title == "已删除文章");
    }

    /// <summary>
    /// 测试按分类筛选
    /// </summary>
    [Fact]
    public async Task GetAllPostsAsync_FilterByCategory_ReturnsCorrectPosts()
    {
        // Arrange
        var query = new PostQueryDto(CategoryId: 2); // 生活分类

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(query);

        // Assert
        Assert.Equal(1, totalCount);
        Assert.Single(posts);
        Assert.Equal("生活分类文章", posts[0].Title);
    }

    /// <summary>
    /// 测试按关键词搜索
    /// </summary>
    [Fact]
    public async Task GetAllPostsAsync_SearchByKeyword_ReturnsMatchingPosts()
    {
        // Arrange
        var query = new PostQueryDto(SearchTerm: "C#");

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(query);

        // Assert
        Assert.Equal(1, totalCount);
        Assert.Single(posts);
        Assert.Equal("搜索测试文章", posts[0].Title);
    }

    /// <summary>
    /// 测试分页
    /// </summary>
    [Fact]
    public async Task GetAllPostsAsync_Pagination_ReturnsCorrectPage()
    {
        // Arrange
        var query = new PostQueryDto(Page: 1, PageSize: 2);

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(query);

        // Assert
        Assert.Equal(4, totalCount); // 总数仍然是 4
        Assert.Equal(2, posts.Count); // 但只返回 2 条
    }

    /// <summary>
    /// 测试组合筛选
    /// </summary>
    [Fact]
    public async Task GetAllPostsAsync_CombinedFilters_WorksCorrectly()
    {
        // Arrange
        var query = new PostQueryDto(
            Page: 1,
            PageSize: 10,
            IncludeHidden: true,
            CategoryId: 1
        );

        // Act
        var (posts, totalCount) = await _postService.GetAllPostsAsync(query);

        // Assert
        Assert.Equal(4, totalCount); // 技术分类：公开文章1, 公开文章2, 隐藏文章, 搜索测试文章 (不含已删除)
        Assert.Contains(posts, p => p.Title == "隐藏文章");
    }
}
