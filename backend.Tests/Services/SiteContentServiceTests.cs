// ============================================================================
// backend.Tests/Services/SiteContentServiceTests.cs - SiteContentService 单元测试
// ============================================================================
// 测试站点内容服务的核心功能：获取、更新、批量操作。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// SiteContentService 单元测试
/// </summary>
public class SiteContentServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly SiteContentService _service;

    public SiteContentServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _service = new SiteContentService(_context);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.SiteContents.AddRange(
            new SiteContent { Key = "about_intro", Value = "介绍内容", Description = "关于页介绍" },
            new SiteContent { Key = "about_author", Value = "作者信息", Description = "作者描述" },
            new SiteContent { Key = "site_title", Value = "博客标题", Description = "网站标题" }
        );
        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    // ========== 获取测试 ==========

    [Fact]
    public async Task GetByKeyAsync_ShouldReturnContent_WhenExists()
    {
        var content = await _service.GetByKeyAsync("about_intro");

        content.Should().NotBeNull();
        content!.Value.Should().Be("介绍内容");
    }

    [Fact]
    public async Task GetByKeyAsync_ShouldReturnNull_WhenNotExists()
    {
        var content = await _service.GetByKeyAsync("nonexistent");
        content.Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllContents()
    {
        var contents = await _service.GetAllAsync();
        contents.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetAllAsync_ShouldBeOrderedByKey()
    {
        var contents = await _service.GetAllAsync();
        contents.Select(c => c.Key).Should().BeInAscendingOrder();
    }

    // ========== Upsert 测试 ==========

    [Fact]
    public async Task UpsertAsync_ShouldUpdateExisting()
    {
        var result = await _service.UpsertAsync("about_intro", "新介绍", null);

        result.Should().NotBeNull();
        result.Value.Should().Be("新介绍");
        
        // 验证数据库
        var content = await _context.SiteContents.FirstAsync(c => c.Key == "about_intro");
        content.Value.Should().Be("新介绍");
    }

    [Fact]
    public async Task UpsertAsync_ShouldCreateNew()
    {
        var countBefore = await _context.SiteContents.CountAsync();

        var result = await _service.UpsertAsync("new_key", "新值", "新描述");

        result.Should().NotBeNull();
        result.Key.Should().Be("new_key");
        
        var countAfter = await _context.SiteContents.CountAsync();
        countAfter.Should().Be(countBefore + 1);
    }

    // ========== UpdateValue 测试 ==========

    [Fact]
    public async Task UpdateValueAsync_ShouldUpdateValue()
    {
        var result = await _service.UpdateValueAsync("site_title", "新标题");

        result.Should().NotBeNull();
        result!.Value.Should().Be("新标题");
    }

    [Fact]
    public async Task UpdateValueAsync_ShouldReturnNull_WhenNotExists()
    {
        var result = await _service.UpdateValueAsync("nonexistent", "值");
        result.Should().BeNull();
    }

    // ========== 批量获取测试 ==========

    [Fact]
    public async Task GetByKeysAsync_ShouldReturnMatchingContents()
    {
        var keys = new[] { "about_intro", "about_author" };

        var result = await _service.GetByKeysAsync(keys);

        result.Should().HaveCount(2);
        result.Should().ContainKey("about_intro");
        result.Should().ContainKey("about_author");
    }

    [Fact]
    public async Task GetByKeysAsync_ShouldIgnoreNonexistentKeys()
    {
        var keys = new[] { "about_intro", "nonexistent" };

        var result = await _service.GetByKeysAsync(keys);

        result.Should().HaveCount(1);
    }

    // ========== 批量更新测试 ==========

    [Fact]
    public async Task BatchUpdateAsync_ShouldUpdateMultiple()
    {
        var updates = new List<(string Key, string Value)>
        {
            ("about_intro", "批量更新1"),
            ("about_author", "批量更新2")
        };

        var count = await _service.BatchUpdateAsync(updates);

        count.Should().Be(2);
        var intro = await _context.SiteContents.FirstAsync(c => c.Key == "about_intro");
        intro.Value.Should().Be("批量更新1");
    }
}
