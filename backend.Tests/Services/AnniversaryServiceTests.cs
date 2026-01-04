// ============================================================================
// backend.Tests/Services/AnniversaryServiceTests.cs - AnniversaryService 单元测试
// ============================================================================
// 测试纪念日服务的核心功能：CRUD、公开获取、日期计算。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// AnniversaryService 单元测试
/// </summary>
public class AnniversaryServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AnniversaryService _service;

    public AnniversaryServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _service = new AnniversaryService(_context);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.Anniversaries.AddRange(
            new Anniversary 
            { 
                Id = 1, 
                Title = "生日", 
                Emoji = "🎂",
                StartDate = new DateOnly(2000, 1, 15),
                RepeatType = "yearly",
                DisplayType = "anniversary",
                IsActive = true,
                DisplayOrder = 1
            },
            new Anniversary 
            { 
                Id = 2, 
                Title = "结婚纪念日", 
                Emoji = "💍",
                StartDate = new DateOnly(2020, 6, 20),
                RepeatType = "yearly",
                DisplayType = "anniversary",
                IsActive = true,
                DisplayOrder = 2
            },
            new Anniversary 
            { 
                Id = 3, 
                Title = "已禁用的纪念日", 
                Emoji = "❌",
                StartDate = new DateOnly(2015, 3, 10),
                RepeatType = "yearly",
                DisplayType = "days",
                IsActive = false,
                DisplayOrder = 3
            }
        );
        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    // ========== 获取测试 ==========

    [Fact]
    public async Task GetActiveAnniversariesAsync_ShouldReturnOnlyActive()
    {
        var anniversaries = await _service.GetActiveAnniversariesAsync();

        anniversaries.Should().HaveCount(2);
        anniversaries.Should().OnlyContain(a => a.Title != "已禁用的纪念日");
    }

    [Fact]
    public async Task GetActiveAnniversariesAsync_ShouldBeOrderedByDisplayOrder()
    {
        var anniversaries = await _service.GetActiveAnniversariesAsync();

        anniversaries[0].Title.Should().Be("生日");
        anniversaries[1].Title.Should().Be("结婚纪念日");
    }

    [Fact]
    public async Task GetAllAnniversariesAsync_ShouldReturnAll()
    {
        var anniversaries = await _service.GetAllAnniversariesAsync();
        anniversaries.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnAnniversary_WhenExists()
    {
        var anniversary = await _service.GetByIdAsync(1);

        anniversary.Should().NotBeNull();
        anniversary!.Title.Should().Be("生日");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        var anniversary = await _service.GetByIdAsync(999);
        anniversary.Should().BeNull();
    }

    // ========== 创建测试 ==========

    [Fact]
    public async Task CreateAsync_ShouldCreateAnniversary()
    {
        var dto = new CreateAnniversaryDto(
            Title: "新纪念日",
            Emoji: "🎉",
            StartDate: "2025-12-25",
            RepeatType: "yearly",
            DisplayType: "anniversary",
            EnableReminder: false,
            ReminderEmail: null,
            ReminderDays: "7,3,1,0" // 必填字段
        );

        var anniversary = await _service.CreateAsync(dto);

        anniversary.Should().NotBeNull();
        anniversary.Title.Should().Be("新纪念日");
        anniversary.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreateAsync_ShouldThrow_WhenInvalidDate()
    {
        var dto = new CreateAnniversaryDto(
            Title: "测试",
            Emoji: "🎉",
            StartDate: "invalid-date",
            RepeatType: "yearly",
            DisplayType: "anniversary",
            EnableReminder: false,
            ReminderEmail: null,
            ReminderDays: "7,3,1,0"
        );

        var action = async () => await _service.CreateAsync(dto);

        await action.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*日期格式无效*");
    }

    // ========== 更新测试 ==========

    [Fact]
    public async Task UpdateAsync_ShouldUpdateTitle()
    {
        var dto = new UpdateAnniversaryDto(
            Title: "更新后的生日",
            Emoji: "🎂",
            StartDate: "2000-01-15",
            RepeatType: "yearly",
            DisplayType: "anniversary",
            IsActive: null,
            DisplayOrder: null,
            EnableReminder: null,
            ReminderEmail: null,
            ReminderDays: null
        );

        var anniversary = await _service.UpdateAsync(1, dto);

        anniversary.Should().NotBeNull();
        anniversary!.Title.Should().Be("更新后的生日");
    }

    [Fact]
    public async Task UpdateAsync_ShouldReturnNull_WhenNotExists()
    {
        var dto = new UpdateAnniversaryDto("标题", "🎂", "2000-01-01", "yearly", "anniversary", null, null, null, null, null);

        var anniversary = await _service.UpdateAsync(999, dto);

        anniversary.Should().BeNull();
    }

    // ========== 删除测试 ==========

    [Fact]
    public async Task DeleteAsync_ShouldRemoveAnniversary()
    {
        var countBefore = await _context.Anniversaries.CountAsync();

        var success = await _service.DeleteAsync(1);

        success.Should().BeTrue();
        var countAfter = await _context.Anniversaries.CountAsync();
        countAfter.Should().Be(countBefore - 1);
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenNotExists()
    {
        var success = await _service.DeleteAsync(999);
        success.Should().BeFalse();
    }
}
