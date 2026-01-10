// ============================================================================
// Services/IPresenceService.cs - 用户在线状态服务接口
// ============================================================================
// 此接口定义了"数字分身"功能的业务契约。
//
// **使用场景**:
//   - Controller 获取当前状态
//   - 管理员设置/清除手动覆盖

// `using` 语句用于导入必要的命名空间
using MyNextBlog.DTOs;  // 引入 UserPresenceDto

namespace MyNextBlog.Services;

/// <summary>
/// `IPresenceService` 定义了用户在线状态模块的业务逻辑接口。
/// 
/// **职责**: 
///   - 获取当前缓存的用户状态
///   - 管理手动状态覆盖
/// </summary>
public interface IPresenceService
{
    /// <summary>
    /// 获取当前缓存的用户状态
    /// </summary>
    /// <returns>用户状态 DTO</returns>
    UserPresenceDto GetCurrentStatus();

    /// <summary>
    /// 更新缓存中的状态（供后台服务调用）
    /// </summary>
    /// <param name="status">新状态</param>
    void UpdateStatus(UserPresenceDto status);

    /// <summary>
    /// 设置手动状态覆盖 (Admin)
    /// </summary>
    /// <param name="status">状态标识</param>
    /// <param name="message">展示消息</param>
    /// <param name="expireAt">过期时间</param>
    Task SetOverrideAsync(string status, string? message, DateTime? expireAt);

    /// <summary>
    /// 清除手动覆盖
    /// </summary>
    Task ClearOverrideAsync();

    /// <summary>
    /// 获取手动覆盖状态（如果存在且未过期）
    /// </summary>
    /// <returns>覆盖状态 DTO，不存在或已过期返回 null</returns>
    Task<UserPresenceDto?> GetOverrideAsync();
}
