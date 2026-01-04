// ============================================================================
// backend.Tests/Services/CommentServiceTests.cs - CommentService 单元测试
// ============================================================================
// 测试评论服务的核心功能：创建、获取、审批、删除。
// 使用 EF Core InMemory 数据库模拟真实环境。

using FluentAssertions;
using Ganss.Xss;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// CommentService 单元测试
/// </summary>
public class CommentServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly CommentService _commentService;
    private readonly IMemoryCache _memoryCache;
    private readonly Mock<ILogger<CommentService>> _mockLogger;
    private readonly Mock<IServiceScopeFactory> _mockScopeFactory;

    public CommentServiceTests()
    {
        // 创建 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _mockLogger = new Mock<ILogger<CommentService>>();
        _mockScopeFactory = new Mock<IServiceScopeFactory>();
        
        // 配置：空的敏感词列表
        var configData = new Dictionary<string, string?>
        {
            ["SpamKeywords:0"] = "spam",
            ["SpamKeywords:1"] = "广告"
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();
        
        // 真实的 HtmlSanitizer
        var sanitizer = new HtmlSanitizer();
        
        // Mock ServiceScopeFactory (通知服务不在测试范围内)
        var mockScope = new Mock<IServiceScope>();
        var mockServiceProvider = new Mock<IServiceProvider>();
        mockScope.Setup(s => s.ServiceProvider).Returns(mockServiceProvider.Object);
        _mockScopeFactory.Setup(f => f.CreateScope()).Returns(mockScope.Object);
        
        // CommentService 构造函数
        _commentService = new CommentService(
            _context,
            sanitizer,
            configuration,
            _memoryCache,
            _mockLogger.Object,
            _mockScopeFactory.Object);
        
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
            Email = "test@test.com",
            Role = "User"
        };
        _context.Users.Add(user);

        // 创建测试文章
        var post = new Post
        {
            Id = 1,
            Title = "测试文章",
            Content = "测试内容",
            UserId = 1
        };
        _context.Posts.Add(post);

        // 创建测试评论
        for (int i = 1; i <= 10; i++)
        {
            _context.Comments.Add(new Comment
            {
                Id = i,
                PostId = 1,
                Content = $"测试评论 {i}",
                GuestName = $"访客{i}",
                CreateTime = DateTime.UtcNow.AddMinutes(-i),
                IsApproved = i <= 8 // 前8条已审核，后2条待审核
            });
        }

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
        _memoryCache.Dispose();
    }

    // ========== 创建评论测试 ==========

    [Fact]
    public async Task CreateCommentAsync_ShouldCreateComment()
    {
        // Arrange
        var postId = 1;
        var content = "这是一条新评论";
        var guestName = "新访客";

        // Act
        var result = await _commentService.CreateCommentAsync(postId, content, guestName, null, null);

        // Assert
        result.Success.Should().BeTrue();
        result.Comment.Should().NotBeNull();
        result.Comment!.Content.Should().Be(content);
    }

    [Fact]
    public async Task CreateCommentAsync_ShouldReturnError_WhenContentIsEmpty()
    {
        // Arrange
        var postId = 1;
        var content = "";

        // Act
        var result = await _commentService.CreateCommentAsync(postId, content, "访客", null, null);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("不能为空");
    }

    [Fact]
    public async Task CreateCommentAsync_ShouldSanitizeXss()
    {
        // Arrange
        var content = "<script>alert('xss')</script>正常内容";

        // Act
        var result = await _commentService.CreateCommentAsync(1, content, "访客", null, null);

        // Assert
        result.Success.Should().BeTrue();
        result.Comment!.Content.Should().NotContain("<script>");
        result.Comment.Content.Should().Contain("正常内容");
    }

    [Fact]
    public async Task CreateCommentAsync_ShouldFlagSpam()
    {
        // Arrange (配置中 "spam" 是敏感词)
        var content = "这是一条spam评论";

        // Act
        var result = await _commentService.CreateCommentAsync(1, content, "访客", null, null);

        // Assert
        result.Success.Should().BeTrue();
        result.Comment!.IsApproved.Should().BeFalse(); // 敏感词评论未审核
    }

    // ========== 获取评论测试 ==========

    [Fact]
    public async Task GetCommentsAsync_ShouldReturnOnlyApprovedComments()
    {
        // Act
        var comments = await _commentService.GetCommentsAsync(1, 1, 20);

        // Assert
        comments.Should().HaveCount(8); // 只有8条已审核
        comments.Should().OnlyContain(c => c.Content.Contains("测试评论"));
    }

    [Fact]
    public async Task GetCommentsAsync_ShouldSupportPagination()
    {
        // Act
        var page1 = await _commentService.GetCommentsAsync(1, 1, 5);
        var page2 = await _commentService.GetCommentsAsync(1, 2, 5);

        // Assert
        page1.Should().HaveCount(5);
        page2.Should().HaveCount(3); // 8条中剩余3条
    }

    [Fact]
    public async Task GetCommentCountAsync_ShouldReturnRootCommentCount()
    {
        // Act
        var count = await _commentService.GetCommentCountAsync(1);

        // Assert
        count.Should().Be(8); // 8条根评论已审核
    }

    // ========== 审批测试 ==========

    [Fact]
    public async Task ToggleApprovalAsync_ShouldToggleStatus()
    {
        // Arrange (评论9未审核)
        var commentBefore = await _context.Comments.FindAsync(9);
        var approvedBefore = commentBefore!.IsApproved;

        // Act
        var success = await _commentService.ToggleApprovalAsync(9);

        // Assert
        success.Should().BeTrue();
        var commentAfter = await _context.Comments.FindAsync(9);
        commentAfter!.IsApproved.Should().Be(!approvedBefore);
    }

    [Fact]
    public async Task ToggleApprovalAsync_ShouldReturnFalse_WhenNotExists()
    {
        // Act
        var success = await _commentService.ToggleApprovalAsync(999);

        // Assert
        success.Should().BeFalse();
    }

    // ========== 删除测试 ==========

    [Fact]
    public async Task DeleteCommentAsync_ShouldRemoveComment()
    {
        // Arrange
        var countBefore = await _context.Comments.CountAsync();

        // Act
        var success = await _commentService.DeleteCommentAsync(1);

        // Assert
        success.Should().BeTrue();
        var countAfter = await _context.Comments.CountAsync();
        countAfter.Should().Be(countBefore - 1);
    }

    [Fact]
    public async Task DeleteCommentAsync_ShouldReturnFalse_WhenNotExists()
    {
        // Act
        var success = await _commentService.DeleteCommentAsync(999);

        // Assert
        success.Should().BeFalse();
    }

    // ========== 批量操作测试 ==========

    [Fact]
    public async Task BatchApproveAsync_ShouldApproveMultiple()
    {
        // Arrange (评论9、10未审核)
        var ids = new List<int> { 9, 10 };

        // Act
        var count = await _commentService.BatchApproveAsync(ids);

        // Assert
        count.Should().Be(2);
        var comment9 = await _context.Comments.FindAsync(9);
        var comment10 = await _context.Comments.FindAsync(10);
        comment9!.IsApproved.Should().BeTrue();
        comment10!.IsApproved.Should().BeTrue();
    }

    [Fact]
    public async Task BatchDeleteAsync_ShouldDeleteMultiple()
    {
        // Arrange
        var ids = new List<int> { 1, 2, 3 };
        var countBefore = await _context.Comments.CountAsync();

        // Act
        var count = await _commentService.BatchDeleteAsync(ids);

        // Assert
        count.Should().Be(3);
        var countAfter = await _context.Comments.CountAsync();
        countAfter.Should().Be(countBefore - 3);
    }

    // ========== 频率限制测试 ==========

    [Fact]
    public void IsRateLimited_ShouldReturnFalse_OnFirstCall()
    {
        // Use a unique IP for this test
        var ip = "192.168.1.100";

        // Act
        var result = _commentService.IsRateLimited(ip);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void IsRateLimited_ShouldReturnTrue_OnSecondCall()
    {
        // Use a unique IP for this test
        var ip = "192.168.1.101";

        // First call
        _commentService.IsRateLimited(ip);

        // Second call (within rate limit window)
        var result = _commentService.IsRateLimited(ip);

        // Assert
        result.Should().BeTrue();
    }
}
