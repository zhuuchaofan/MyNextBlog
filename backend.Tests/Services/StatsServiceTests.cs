// ============================================================================
// backend.Tests/Services/StatsServiceTests.cs - StatsService 单元测试
// ============================================================================
// 测试统计服务的核心功能：公开统计、管理员仪表盘。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// StatsService 单元测试
/// </summary>
public class StatsServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly StatsService _service;

    public StatsServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _service = new StatsService(_context);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 创建用户
        var user = new User { Id = 1, Username = "test", PasswordHash = "hash", Email = "test@test.com" };
        _context.Users.Add(user);

        // 创建文章
        _context.Posts.AddRange(
            new Post { Id = 1, Title = "公开文章1", Content = "内容", UserId = 1, IsHidden = false, IsDeleted = false },
            new Post { Id = 2, Title = "公开文章2", Content = "内容", UserId = 1, IsHidden = false, IsDeleted = false },
            new Post { Id = 3, Title = "草稿", Content = "内容", UserId = 1, IsHidden = true, IsDeleted = false },
            new Post { Id = 4, Title = "已删除", Content = "内容", UserId = 1, IsHidden = false, IsDeleted = true }
        );

        // 创建评论
        _context.Comments.AddRange(
            new Comment { Id = 1, PostId = 1, Content = "评论1", GuestName = "访客1" },
            new Comment { Id = 2, PostId = 1, Content = "评论2", GuestName = "访客2" },
            new Comment { Id = 3, PostId = 2, Content = "评论3", GuestName = "访客3" }
        );

        // 创建分类和标签
        _context.Categories.AddRange(
            new Category { Id = 1, Name = "分类1" },
            new Category { Id = 2, Name = "分类2" }
        );

        _context.Tags.AddRange(
            new Tag { Id = 1, Name = "标签1" },
            new Tag { Id = 2, Name = "标签2" },
            new Tag { Id = 3, Name = "标签3" }
        );

        // 创建系列
        _context.Series.Add(new Series { Id = 1, Name = "系列1", Description = "描述" });

        // 创建站点统计
        _context.SiteContents.AddRange(
            new SiteContent { Key = "sys_stats_visits", Value = "100", Description = "访问量" },
            new SiteContent { Key = "site_launch_date", Value = "2025-12-01", Description = "启动日期" }
        );

        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    // ========== 公开统计测试 ==========

    [Fact]
    public async Task GetPublicStatsAsync_ShouldReturnCorrectVisits()
    {
        var stats = await _service.GetPublicStatsAsync();
        stats.Visits.Should().Be(100);
    }

    [Fact]
    public async Task GetPublicStatsAsync_ShouldCountOnlyPublicPosts()
    {
        var stats = await _service.GetPublicStatsAsync();
        stats.PostsCount.Should().Be(2); // 排除隐藏和删除的
    }

    [Fact]
    public async Task GetPublicStatsAsync_ShouldCountAllComments()
    {
        var stats = await _service.GetPublicStatsAsync();
        stats.CommentsCount.Should().Be(3);
    }

    [Fact]
    public async Task GetPublicStatsAsync_ShouldCalculateRunningDays()
    {
        var stats = await _service.GetPublicStatsAsync();
        stats.RunningDays.Should().BeGreaterThan(0);
    }

    // ========== 管理员仪表盘测试 ==========

    [Fact]
    public async Task GetAdminDashboardAsync_ShouldReturnTotalPosts()
    {
        var dashboard = await _service.GetAdminDashboardAsync();
        dashboard.Posts.Total.Should().Be(3); // 排除软删除
    }

    [Fact]
    public async Task GetAdminDashboardAsync_ShouldReturnPublishedPosts()
    {
        var dashboard = await _service.GetAdminDashboardAsync();
        dashboard.Posts.Published.Should().Be(2);
    }

    [Fact]
    public async Task GetAdminDashboardAsync_ShouldReturnDraftPosts()
    {
        var dashboard = await _service.GetAdminDashboardAsync();
        dashboard.Posts.Draft.Should().Be(1);
    }

    [Fact]
    public async Task GetAdminDashboardAsync_ShouldReturnCommentCount()
    {
        var dashboard = await _service.GetAdminDashboardAsync();
        dashboard.Comments.Should().Be(3);
    }

    [Fact]
    public async Task GetAdminDashboardAsync_ShouldReturnCategoryCount()
    {
        var dashboard = await _service.GetAdminDashboardAsync();
        dashboard.Categories.Should().Be(2);
    }

    [Fact]
    public async Task GetAdminDashboardAsync_ShouldReturnTagCount()
    {
        var dashboard = await _service.GetAdminDashboardAsync();
        dashboard.Tags.Should().Be(3);
    }

    [Fact]
    public async Task GetAdminDashboardAsync_ShouldReturnSeriesCount()
    {
        var dashboard = await _service.GetAdminDashboardAsync();
        dashboard.Series.Should().Be(1);
    }
}
