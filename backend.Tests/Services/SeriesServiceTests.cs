// ============================================================================
// backend.Tests/Services/SeriesServiceTests.cs - SeriesService 单元测试
// ============================================================================
// 测试系列服务的核心功能：CRUD 操作、文章列表获取

using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// SeriesService 单元测试
/// </summary>
public class SeriesServiceTests
{
    private static (SqliteConnection Connection, AppDbContext Context, SeriesService Service) CreateTestContext()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        
        var service = new SeriesService(context);
        
        SeedTestData(context);
        
        return (connection, context, service);
    }

    private static void SeedTestData(AppDbContext context)
    {
        // 创建测试用户
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            PasswordHash = "hash",
            Email = "test@test.com"
        };
        context.Users.Add(user);

        // 创建分类
        var category = new Category { Id = 1, Name = "技术" };
        context.Categories.Add(category);

        // 创建系列
        context.Series.AddRange(
            new Series { Id = 1, Name = "Next.js 入门", Description = "从零开始学习 Next.js" },
            new Series { Id = 2, Name = ".NET 进阶", Description = ".NET 高级话题" },
            new Series { Id = 3, Name = "空系列", Description = "没有文章的系列" }
        );

        // 创建文章
        context.Posts.AddRange(
            new Post
            {
                Id = 1,
                Title = "Next.js 第一课",
                Content = "![cover](https://example.com/cover.jpg)\n这是第一课内容",
                UserId = 1,
                CategoryId = 1,
                SeriesId = 1,
                SeriesOrder = 1,
                IsHidden = false
            },
            new Post
            {
                Id = 2,
                Title = "Next.js 第二课",
                Content = "这是第二课内容，没有图片",
                UserId = 1,
                CategoryId = 1,
                SeriesId = 1,
                SeriesOrder = 2,
                IsHidden = false
            },
            new Post
            {
                Id = 3,
                Title = "Next.js 草稿",
                Content = "这是草稿",
                UserId = 1,
                CategoryId = 1,
                SeriesId = 1,
                SeriesOrder = 3,
                IsHidden = true  // 隐藏文章
            },
            new Post
            {
                Id = 4,
                Title = ".NET 性能优化",
                Content = "性能优化技巧",
                UserId = 1,
                CategoryId = 1,
                SeriesId = 2,
                SeriesOrder = 1,
                IsHidden = false
            }
        );

        context.SaveChanges();
    }

    // ========== GetAllSeriesAsync 测试 ==========

    [Fact]
    public async Task GetAllSeriesAsync_ShouldReturnAllSeries()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var series = await service.GetAllSeriesAsync();

            series.Should().HaveCount(3);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task GetAllSeriesAsync_ShouldCountOnlyVisiblePosts_WhenNotIncludeHidden()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var series = await service.GetAllSeriesAsync(includeHidden: false);

            var nextjsSeries = series.First(s => s.Name == "Next.js 入门");
            nextjsSeries.PostCount.Should().Be(2); // 不包含隐藏的第3篇
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task GetAllSeriesAsync_ShouldCountAllPosts_WhenIncludeHidden()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var series = await service.GetAllSeriesAsync(includeHidden: true);

            var nextjsSeries = series.First(s => s.Name == "Next.js 入门");
            nextjsSeries.PostCount.Should().Be(3); // 包含隐藏的文章
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== GetSeriesByIdAsync 测试 ==========

    [Fact]
    public async Task GetSeriesByIdAsync_ShouldReturnSeries_WhenExists()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var series = await service.GetSeriesByIdAsync(1);

            series.Should().NotBeNull();
            series!.Name.Should().Be("Next.js 入门");
            series.PostCount.Should().Be(2); // 不含隐藏
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task GetSeriesByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var series = await service.GetSeriesByIdAsync(999);

            series.Should().BeNull();
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== GetSeriesPostsAsync 测试 ==========

    [Fact]
    public async Task GetSeriesPostsAsync_ShouldReturnPostsInOrder()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var posts = await service.GetSeriesPostsAsync(1, includeHidden: false);

            posts.Should().HaveCount(2);
            posts[0].Title.Should().Be("Next.js 第一课");
            posts[1].Title.Should().Be("Next.js 第二课");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task GetSeriesPostsAsync_ShouldIncludeHiddenPosts_WhenIncludeHidden()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var posts = await service.GetSeriesPostsAsync(1, includeHidden: true);

            posts.Should().HaveCount(3);
            posts.Should().Contain(p => p.Title == "Next.js 草稿");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task GetSeriesPostsAsync_ShouldExtractCoverImage()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var posts = await service.GetSeriesPostsAsync(1, includeHidden: false);

            var firstPost = posts.First(p => p.Title == "Next.js 第一课");
            firstPost.CoverImage.Should().Be("https://example.com/cover.jpg");

            var secondPost = posts.First(p => p.Title == "Next.js 第二课");
            secondPost.CoverImage.Should().BeNull();
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== CreateSeriesAsync 测试 ==========

    [Fact]
    public async Task CreateSeriesAsync_ShouldCreateSeries()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var dto = new CreateSeriesDto("Docker 教程", "学习 Docker 容器化");

            var result = await service.CreateSeriesAsync(dto);

            result.Should().NotBeNull();
            result.Name.Should().Be("Docker 教程");
            result.Description.Should().Be("学习 Docker 容器化");
            result.PostCount.Should().Be(0);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== UpdateSeriesAsync 测试 ==========

    [Fact]
    public async Task UpdateSeriesAsync_ShouldUpdateSeries()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var dto = new UpdateSeriesDto("Next.js 进阶", "进阶内容");

            var result = await service.UpdateSeriesAsync(1, dto);

            result.Name.Should().Be("Next.js 进阶");
            result.Description.Should().Be("进阶内容");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateSeriesAsync_ShouldThrow_WhenNotExists()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var dto = new UpdateSeriesDto("不存在", "描述");

            var action = async () => await service.UpdateSeriesAsync(999, dto);

            await action.Should().ThrowAsync<ArgumentException>()
                .WithMessage("*not found*");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== DeleteSeriesAsync 测试 ==========

    [Fact]
    public async Task DeleteSeriesAsync_ShouldDeleteSeries()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            await service.DeleteSeriesAsync(3); // 删除空系列

            var series = await context.Series.FindAsync(3);
            series.Should().BeNull();
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task DeleteSeriesAsync_ShouldNotThrow_WhenNotExists()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var action = async () => await service.DeleteSeriesAsync(999);

            await action.Should().NotThrowAsync();
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== GetNextOrderAsync 测试 ==========

    [Fact]
    public async Task GetNextOrderAsync_ShouldReturnNextOrder()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var nextOrder = await service.GetNextOrderAsync(1);

            nextOrder.Should().Be(4); // 最大 SeriesOrder 是 3
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task GetNextOrderAsync_ShouldReturn1_WhenNoPostsInSeries()
    {
        var (connection, context, service) = CreateTestContext();
        try
        {
            var nextOrder = await service.GetNextOrderAsync(3); // 空系列

            nextOrder.Should().Be(1);
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }
}
