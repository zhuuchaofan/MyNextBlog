// ============================================================================
// backend.Tests/Services/PlanServiceTests.cs - PlanService 单元测试
// ============================================================================
// 测试计划服务的核心功能：CRUD、日程管理、活动管理。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// PlanService 单元测试
/// </summary>
public class PlanServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly PlanService _service;

    public PlanServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _service = new PlanService(_context);
        
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 创建测试计划
        var plan = new Plan
        {
            Id = 1,
            Title = "东京之旅",
            Description = "日本东京旅行计划",
            Type = "旅行",
            StartDate = new DateOnly(2026, 3, 1),
            EndDate = new DateOnly(2026, 3, 5),
            Budget = 10000,
            Currency = "CNY",
            Status = "Planning",
            IsSecret = false
        };
        _context.Plans.Add(plan);

        // 创建日程
        var day1 = new PlanDay
        {
            Id = 1,
            PlanId = 1,
            DayNumber = 1,
            Date = new DateOnly(2026, 3, 1),
            Theme = "到达日"
        };
        _context.PlanDays.Add(day1);

        // 创建活动
        _context.PlanActivities.AddRange(
            new PlanActivity { Id = 1, PlanDayId = 1, Title = "机场到酒店", Time = "14:00", SortOrder = 1 },
            new PlanActivity { Id = 2, PlanDayId = 1, Title = "入住酒店", Time = "16:00", SortOrder = 2 }
        );

        // 创建私密计划
        _context.Plans.Add(new Plan
        {
            Id = 2,
            Title = "私密计划",
            Type = "其他",
            StartDate = new DateOnly(2026, 4, 1),
            IsSecret = true
        });

        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    // ========== 获取计划测试 ==========

    [Fact]
    public async Task GetAllPlansAsync_ShouldReturnAllPlans()
    {
        var plans = await _service.GetAllPlansAsync();
        plans.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllPlansAsync_ShouldBeOrderedByStartDateDesc()
    {
        var plans = await _service.GetAllPlansAsync();
        plans[0].Title.Should().Be("私密计划"); // 2026-04 在前
        plans[1].Title.Should().Be("东京之旅"); // 2026-03 在后
    }

    [Fact]
    public async Task GetPlanByIdAsync_ShouldReturnPlanWithDays()
    {
        var plan = await _service.GetPlanByIdAsync(1);

        plan.Should().NotBeNull();
        plan!.Title.Should().Be("东京之旅");
        plan.Days.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetPlanByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        var plan = await _service.GetPlanByIdAsync(999);
        plan.Should().BeNull();
    }

    // ========== 创建计划测试 ==========

    [Fact]
    public async Task CreatePlanAsync_ShouldCreatePlan()
    {
        var dto = new CreatePlanDto(
            Title: "新计划",
            Description: "测试描述",
            Type: "活动",
            StartDate: "2026-05-01",
            EndDate: "2026-05-03",
            Budget: 5000,
            Currency: "CNY",
            IsSecret: false,
            EnableReminder: false,
            ReminderEmail: null,
            ReminderDays: "7,3,1,0", // 必填字段
            AnniversaryId: null
        );

        var plan = await _service.CreatePlanAsync(dto);

        plan.Should().NotBeNull();
        plan.Title.Should().Be("新计划");
        plan.Id.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreatePlanAsync_ShouldThrow_WhenInvalidStartDate()
    {
        var dto = new CreatePlanDto(
            Title: "计划",
            Description: null,
            Type: "活动",
            StartDate: "invalid-date",
            EndDate: null,
            Budget: 0,
            Currency: "CNY",
            IsSecret: false,
            EnableReminder: false,
            ReminderEmail: null,
            ReminderDays: "7,3,1,0",
            AnniversaryId: null
        );

        var action = async () => await _service.CreatePlanAsync(dto);

        await action.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*开始日期格式无效*");
    }

    [Fact]
    public async Task CreatePlanAsync_ShouldThrow_WhenEndDateBeforeStart()
    {
        var dto = new CreatePlanDto(
            Title: "计划",
            Description: null,
            Type: "活动",
            StartDate: "2026-05-05",
            EndDate: "2026-05-01", // 早于开始日期
            Budget: 0,
            Currency: "CNY",
            IsSecret: false,
            EnableReminder: false,
            ReminderEmail: null,
            ReminderDays: "7,3,1,0",
            AnniversaryId: null
        );

        var action = async () => await _service.CreatePlanAsync(dto);

        await action.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*结束日期不能早于开始日期*");
    }

    // ========== 更新计划测试 ==========

    [Fact]
    public async Task UpdatePlanAsync_ShouldUpdateTitle()
    {
        var dto = new UpdatePlanDto(
            Title: "更新后的标题",
            Description: null,
            Type: null,
            StartDate: null,
            EndDate: null,
            Budget: null,
            ActualCost: null,
            Currency: null,
            Status: null,
            IsSecret: null,
            EnableReminder: null,
            ReminderEmail: null,
            ReminderDays: null,
            AnniversaryId: null
        );

        var plan = await _service.UpdatePlanAsync(1, dto);

        plan.Should().NotBeNull();
        plan!.Title.Should().Be("更新后的标题");
    }

    [Fact]
    public async Task UpdatePlanAsync_ShouldReturnNull_WhenNotExists()
    {
        var dto = new UpdatePlanDto("标题", null, null, null, null, null, null, null, null, null, null, null, null, null);

        var plan = await _service.UpdatePlanAsync(999, dto);

        plan.Should().BeNull();
    }

    // ========== 删除计划测试 ==========

    [Fact]
    public async Task DeletePlanAsync_ShouldRemovePlan()
    {
        var countBefore = await _context.Plans.CountAsync();

        var success = await _service.DeletePlanAsync(1);

        success.Should().BeTrue();
        var countAfter = await _context.Plans.CountAsync();
        countAfter.Should().Be(countBefore - 1);
    }

    [Fact]
    public async Task DeletePlanAsync_ShouldReturnFalse_WhenNotExists()
    {
        var success = await _service.DeletePlanAsync(999);
        success.Should().BeFalse();
    }

    // ========== 日程管理测试 ==========

    [Fact]
    public async Task AddDayAsync_ShouldCreateDay()
    {
        var dto = new CreatePlanDayDto(DayNumber: 2, Date: "2026-03-02", Theme: "第二天");

        var day = await _service.AddDayAsync(1, dto);

        day.Should().NotBeNull();
        day.DayNumber.Should().Be(2);
    }

    [Fact]
    public async Task DeleteDayAsync_ShouldRemoveDay()
    {
        var success = await _service.DeleteDayAsync(1);

        success.Should().BeTrue();
        var exists = await _context.PlanDays.AnyAsync(d => d.Id == 1);
        exists.Should().BeFalse();
    }

    // ========== 活动管理测试 ==========

    [Fact]
    public async Task AddActivityAsync_ShouldCreateActivity()
    {
        var dto = new CreateActivityDto(
            Time: "18:00",
            Title: "晚餐",
            Location: "餐厅",
            Notes: null,
            EstimatedCost: 200,
            SortOrder: 3
        );

        var activity = await _service.AddActivityAsync(1, dto);

        activity.Should().NotBeNull();
        activity.Title.Should().Be("晚餐");
    }

    [Fact]
    public async Task DeleteActivityAsync_ShouldRemoveActivity()
    {
        var success = await _service.DeleteActivityAsync(1);

        success.Should().BeTrue();
        var exists = await _context.PlanActivities.AnyAsync(a => a.Id == 1);
        exists.Should().BeFalse();
    }

    // ========== 公开 API 测试 ==========

    [Fact]
    public async Task GetPublicPlanByIdAsync_ShouldReturnPlan()
    {
        var plan = await _service.GetPublicPlanByIdAsync(1);

        plan.Should().NotBeNull();
        plan!.Title.Should().Be("东京之旅");
    }

    [Fact]
    public async Task GetPublicPlanByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        var plan = await _service.GetPublicPlanByIdAsync(999);
        plan.Should().BeNull();
    }
}
