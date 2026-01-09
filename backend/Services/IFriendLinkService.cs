// ============================================================================
// Services/IFriendLinkService.cs - 友链服务接口
// ============================================================================
// 定义友链 CRUD 操作和状态更新接口。

using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

/// <summary>
/// 友链服务接口
/// </summary>
public interface IFriendLinkService
{
    /// <summary>
    /// 获取所有启用的友链 (用于前台展示)
    /// </summary>
    /// <returns>按 DisplayOrder 排序的友链列表</returns>
    Task<List<FriendLinkDto>> GetAllActiveAsync();
    
    /// <summary>
    /// 获取所有友链 (管理员，包含禁用的)
    /// </summary>
    Task<List<FriendLinkAdminDto>> GetAllAsync();
    
    /// <summary>
    /// 根据 ID 获取友链详情
    /// </summary>
    Task<FriendLinkAdminDto?> GetByIdAsync(int id);
    
    /// <summary>
    /// 创建新友链
    /// </summary>
    Task<FriendLinkAdminDto> CreateAsync(CreateFriendLinkDto dto);
    
    /// <summary>
    /// 更新友链
    /// </summary>
    Task<FriendLinkAdminDto?> UpdateAsync(int id, UpdateFriendLinkDto dto);
    
    /// <summary>
    /// 删除友链
    /// </summary>
    Task<bool> DeleteAsync(int id);
    
    /// <summary>
    /// 更新健康状态 (由后台健康检查服务调用)
    /// </summary>
    /// <param name="id">友链 ID</param>
    /// <param name="isOnline">是否在线</param>
    /// <param name="latencyMs">响应延迟 (ms)</param>
    Task UpdateHealthStatusAsync(int id, bool isOnline, int? latencyMs);
}
