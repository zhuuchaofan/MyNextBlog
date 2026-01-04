// ============================================================================
// backend.Tests/Services/EmailTemplateServiceTests.cs - EmailTemplateService 单元测试
// ============================================================================
// 测试邮件模板服务的核心功能：获取、更新、渲染。

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
/// EmailTemplateService 单元测试
/// </summary>
public class EmailTemplateServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly EmailTemplateService _service;
    private readonly IMemoryCache _cache;
    private readonly Mock<ILogger<EmailTemplateService>> _mockLogger;

    public EmailTemplateServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _cache = new MemoryCache(new MemoryCacheOptions());
        _mockLogger = new Mock<ILogger<EmailTemplateService>>();
        
        _service = new EmailTemplateService(_context, _cache, _mockLogger.Object);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.EmailTemplates.AddRange(
            new EmailTemplate
            {
                Id = 1,
                TemplateKey = "new_comment",
                Name = "新评论通知",
                SubjectTemplate = "您收到一条新评论 - {{PostTitle}}",
                BodyTemplate = "<p>您好，{{AuthorName}} 在文章 <b>{{PostTitle}}</b> 发表了评论。</p>",
                AvailablePlaceholders = "PostTitle,AuthorName,CommentContent",
                Description = "评论通知模板",
                IsEnabled = true
            },
            new EmailTemplate
            {
                Id = 2,
                TemplateKey = "disabled_template",
                Name = "已禁用模板",
                SubjectTemplate = "测试",
                BodyTemplate = "<p>测试</p>",
                IsEnabled = false
            }
        );
        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
        _cache.Dispose();
    }

    // ========== 获取测试 ==========

    [Fact]
    public async Task GetAllAsync_ShouldReturnAllTemplates()
    {
        var templates = await _service.GetAllAsync();
        templates.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetByKeyAsync_ShouldReturnTemplate_WhenExists()
    {
        var template = await _service.GetByKeyAsync("new_comment");

        template.Should().NotBeNull();
        template!.Name.Should().Be("新评论通知");
    }

    [Fact]
    public async Task GetByKeyAsync_ShouldReturnNull_WhenNotExists()
    {
        var template = await _service.GetByKeyAsync("nonexistent");
        template.Should().BeNull();
    }

    // ========== 更新测试 ==========

    [Fact]
    public async Task UpdateAsync_ShouldUpdateTemplate()
    {
        var dto = new UpdateEmailTemplateDto(
            SubjectTemplate: "新主题",
            BodyTemplate: "<p>新内容</p>",
            IsEnabled: true
        );

        var success = await _service.UpdateAsync("new_comment", dto);

        success.Should().BeTrue();
        var updated = await _context.EmailTemplates.FirstAsync(t => t.TemplateKey == "new_comment");
        updated.SubjectTemplate.Should().Be("新主题");
    }

    [Fact]
    public async Task UpdateAsync_ShouldReturnFalse_WhenNotExists()
    {
        var dto = new UpdateEmailTemplateDto("主题", "内容", true);

        var success = await _service.UpdateAsync("nonexistent", dto);

        success.Should().BeFalse();
    }

    // ========== 渲染测试 ==========

    [Fact]
    public async Task RenderAsync_ShouldReplacePlaceholders()
    {
        var data = new Dictionary<string, string>
        {
            ["PostTitle"] = "测试文章",
            ["AuthorName"] = "张三"
        };

        var result = await _service.RenderAsync("new_comment", data);

        result.Should().NotBeNull();
        result!.Value.Subject.Should().Contain("测试文章");
        result.Value.Body.Should().Contain("张三");
    }

    [Fact]
    public async Task RenderAsync_ShouldHtmlEncode_InBody()
    {
        var data = new Dictionary<string, string>
        {
            ["PostTitle"] = "<script>alert('xss')</script>",
            ["AuthorName"] = "攻击者"
        };

        var result = await _service.RenderAsync("new_comment", data);

        result.Should().NotBeNull();
        result!.Value.Body.Should().NotContain("<script>");
        result.Value.Body.Should().Contain("&lt;script&gt;"); // HTML 编码
    }

    [Fact]
    public async Task RenderAsync_ShouldReturnNull_WhenTemplateNotExists()
    {
        var result = await _service.RenderAsync("nonexistent", new Dictionary<string, string>());
        result.Should().BeNull();
    }

    [Fact]
    public async Task RenderAsync_ShouldReturnNull_WhenTemplateDisabled()
    {
        var result = await _service.RenderAsync("disabled_template", new Dictionary<string, string>());
        result.Should().BeNull();
    }
}
