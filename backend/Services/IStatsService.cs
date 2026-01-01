// ============================================================================
// Services/IStatsService.cs - 统计服务接口
// ============================================================================
// 此接口定义了统计模块的业务契约。
//
// **设计目的**: 将统计逻辑从 Controller 层分离到 Service 层，遵循 Clean Architecture

// `using` 语句用于导入必要的命名空间
using MyNextBlog.DTOs;  // 数据传输对象

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `IStatsService` 定义了统计模块的业务逻辑接口。
/// 
/// **职责**: 
///   - 公开统计 (首页 Pulse)
///   - 管理员仪表盘统计
///   - 访问量计数管理
/// </summary>
public interface IStatsService
{
    /// <summary>
    /// 获取公开统计数据（用于首页 Pulse 组件）
    /// </summary>
    /// <returns>包含访问量、文章数、评论数、运行天数的 DTO</returns>
    Task<SiteStatsDto> GetPublicStatsAsync();
    
    /// <summary>
    /// 记录一次访问（访问量 +1）
    /// </summary>
    /// <remarks>
    /// 使用原子更新操作防止并发问题
    /// </remarks>
    Task IncrementVisitCountAsync();
    
    /// <summary>
    /// 获取管理员仪表盘统计数据
    /// </summary>
    /// <returns>包含文章、评论、分类、标签、系列统计的 DTO</returns>
    Task<AdminDashboardDto> GetAdminDashboardAsync();
}
