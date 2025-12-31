// ============================================================================
// Services/IPlanService.cs - 计划服务接口
// ============================================================================
// 此接口定义了旅行/活动计划管理的业务契约。
//
// **核心功能**: 
//   - Plan (计划) -> PlanDay (日程) -> PlanActivity (活动) 的级联管理
//   - 预算统计与排序优化

// `using` 语句用于导入必要的命名空间
using MyNextBlog.DTOs;    // 数据传输对象
using MyNextBlog.Models;  // 领域模型

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `IPlanService` 定义了计划模块的业务逻辑接口。
/// 
/// **职责**: 计划全生命周期管理，公开预览，预算分析
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
    
    /// <summary>
    /// 获取公开预览的计划详情（无需认证，隐藏敏感信息）
    /// </summary>
    Task<PublicPlanDetailDto?> GetPublicPlanByIdAsync(int id);
}
