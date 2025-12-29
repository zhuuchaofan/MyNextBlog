// Services/IPlanService.cs
// 计划服务接口定义

using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 计划服务接口，提供计划 CRUD 及嵌套日程/活动管理
/// </summary>
public interface IPlanService
{
    // ========== Plan CRUD ==========
    
    /// <summary>
    /// 获取所有计划列表
    /// </summary>
    Task<List<PlanListDto>> GetAllPlansAsync();
    
    /// <summary>
    /// 根据 ID 获取计划详情（含日程和活动）
    /// </summary>
    Task<PlanDetailDto?> GetPlanByIdAsync(int id);
    
    /// <summary>
    /// 创建新计划
    /// </summary>
    Task<Plan> CreatePlanAsync(CreatePlanDto dto);
    
    /// <summary>
    /// 更新计划
    /// </summary>
    Task<Plan?> UpdatePlanAsync(int id, UpdatePlanDto dto);
    
    /// <summary>
    /// 删除计划
    /// </summary>
    Task<bool> DeletePlanAsync(int id);
    
    // ========== PlanDay CRUD ==========
    
    /// <summary>
    /// 为计划添加一天
    /// </summary>
    Task<PlanDay> AddDayAsync(int planId, CreatePlanDayDto dto);
    
    /// <summary>
    /// 更新某天
    /// </summary>
    Task<PlanDay?> UpdateDayAsync(int dayId, UpdatePlanDayDto dto);
    
    /// <summary>
    /// 删除某天
    /// </summary>
    Task<bool> DeleteDayAsync(int dayId);
    
    // ========== PlanActivity CRUD ==========
    
    /// <summary>
    /// 为某天添加活动
    /// </summary>
    Task<PlanActivity> AddActivityAsync(int dayId, CreateActivityDto dto);
    
    /// <summary>
    /// 更新活动
    /// </summary>
    Task<PlanActivity?> UpdateActivityAsync(int activityId, UpdateActivityDto dto);
    
    /// <summary>
    /// 删除活动
    /// </summary>
    Task<bool> DeleteActivityAsync(int activityId);
    
    // ========== 统计方法 ==========
    
    /// <summary>
    /// 获取计划的预算统计
    /// </summary>
    Task<(decimal TotalEstimated, decimal TotalActual)> GetBudgetSummaryAsync(int planId);
    
    /// <summary>
    /// 批量更新活动排序
    /// </summary>
    Task BatchUpdateActivitySortOrderAsync(List<ActivitySortItem> items);
}
