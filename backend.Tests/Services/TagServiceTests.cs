// ============================================================================
// backend.Tests/Services/TagServiceTests.cs - TagService 单元测试
// ============================================================================
// 测试标签服务的核心功能：热门标签、创建去重。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// TagService 单元测试
/// </summary>
public class TagServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly TagService _tagService;

    public TagServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _tagService = new TagService(_context);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 创建标签
        var tag1 = new Tag { Id = 1, Name = "C#" };
        var tag2 = new Tag { Id = 2, Name = "JavaScript" };
        var tag3 = new Tag { Id = 3, Name = "Python" };
        var tag4 = new Tag { Id = 4, Name = "冷门标签" }; // 没有关联文章
        
        _context.Tags.AddRange(tag1, tag2, tag3, tag4);

        // 创建用户
        var user = new User { Id = 1, Username = "test", PasswordHash = "hash", Email = "test@test.com" };
        _context.Users.Add(user);

        // 创建文章并关联标签
        var post1 = new Post { Id = 1, Title = "C# 入门", Content = "内容", UserId = 1 };
        var post2 = new Post { Id = 2, Title = "JS 基础", Content = "内容", UserId = 1 };
        var post3 = new Post { Id = 3, Title = "高级 C#", Content = "内容", UserId = 1 };
        var post4 = new Post { Id = 4, Title = "隐藏文章", Content = "内容", UserId = 1, IsHidden = true };
        
        post1.Tags.Add(tag1); // C# - 2篇
        post3.Tags.Add(tag1);
        post2.Tags.Add(tag2); // JavaScript - 1篇
        post4.Tags.Add(tag3); // Python - 只在隐藏文章中

        _context.Posts.AddRange(post1, post2, post3, post4);
        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    // ========== 热门标签测试 ==========

    [Fact]
    public async Task GetPopularTagsAsync_ShouldReturnOrderedByCount()
    {
        var tags = await _tagService.GetPopularTagsAsync(10, includeHidden: false);

        tags.Should().HaveCount(2); // C# (2篇) 和 JavaScript (1篇)
        tags[0].Name.Should().Be("C#"); // 最热门
        tags[1].Name.Should().Be("JavaScript");
    }

    [Fact]
    public async Task GetPopularTagsAsync_ShouldRespectCountLimit()
    {
        var tags = await _tagService.GetPopularTagsAsync(1, includeHidden: false);
        tags.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetPopularTagsAsync_ShouldExcludeHiddenPosts_ByDefault()
    {
        var tags = await _tagService.GetPopularTagsAsync(10, includeHidden: false);
        
        // Python 只关联隐藏文章，不应出现
        tags.Should().NotContain(t => t.Name == "Python");
    }

    [Fact]
    public async Task GetPopularTagsAsync_ShouldIncludeHiddenPosts_WhenRequested()
    {
        var tags = await _tagService.GetPopularTagsAsync(10, includeHidden: true);
        
        // 包含隐藏文章时，Python 应该出现
        tags.Should().Contain(t => t.Name == "Python");
    }

    [Fact]
    public async Task GetPopularTagsAsync_ShouldExcludeUnusedTags()
    {
        var tags = await _tagService.GetPopularTagsAsync(10, includeHidden: true);
        
        // "冷门标签" 没有关联任何文章
        tags.Should().NotContain(t => t.Name == "冷门标签");
    }

    // ========== 创建标签测试 ==========

    [Fact]
    public async Task GetOrCreateTagsAsync_ShouldReturnExistingTags()
    {
        var tags = await _tagService.GetOrCreateTagsAsync(["C#"]);

        tags.Should().HaveCount(1);
        tags[0].Id.Should().Be(1); // 使用现有的 C# 标签
    }

    [Fact]
    public async Task GetOrCreateTagsAsync_ShouldCreateNewTags()
    {
        var countBefore = await _context.Tags.CountAsync();

        var tags = await _tagService.GetOrCreateTagsAsync(["Go", "Rust"]);

        var countAfter = await _context.Tags.CountAsync();
        tags.Should().HaveCount(2);
        countAfter.Should().Be(countBefore + 2);
    }

    [Fact]
    public async Task GetOrCreateTagsAsync_ShouldHandleMixedExistingAndNew()
    {
        var tags = await _tagService.GetOrCreateTagsAsync(["C#", "新标签"]);

        tags.Should().HaveCount(2);
        tags.Should().Contain(t => t.Name == "C#" && t.Id == 1);
        tags.Should().Contain(t => t.Name == "新标签");
    }

    [Fact]
    public async Task GetOrCreateTagsAsync_ShouldIgnoreEmptyNames()
    {
        var tags = await _tagService.GetOrCreateTagsAsync(["C#", "", "  ", "有效标签"]);
        tags.Should().HaveCount(2); // 空白的被忽略
    }

    [Fact]
    public async Task GetOrCreateTagsAsync_ShouldDeduplicateInput()
    {
        var tags = await _tagService.GetOrCreateTagsAsync(["重复", "重复", "重复"]);
        tags.Should().HaveCount(1);
    }
}
