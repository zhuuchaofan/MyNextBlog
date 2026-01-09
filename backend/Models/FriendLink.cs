// ============================================================================
// Models/FriendLink.cs - 友链模型
// ============================================================================
// 存储友情链接信息及其健康状态。
// 后台服务会定期检测友链在线状态并更新 IsOnline/LatencyMs 字段。

namespace MyNextBlog.Models;

/// <summary>
/// 友链模型 - 存储友站信息及健康状态
/// </summary>
public class FriendLink
{
    /// <summary>
    /// 主键 ID
    /// </summary>
    public int Id { get; set; }
    
    // ========== 基础信息 ==========
    
    /// <summary>
    /// 友站名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 友站 URL (完整地址，如 https://example.com)
    /// </summary>
    public string Url { get; set; } = string.Empty;
    
    /// <summary>
    /// 友站描述/简介
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// 友站头像/Logo URL
    /// </summary>
    public string? AvatarUrl { get; set; }
    
    // ========== 健康状态 (由后台任务更新) ==========
    
    /// <summary>
    /// 是否在线 (由健康检查服务更新)
    /// </summary>
    public bool IsOnline { get; set; } = true;
    
    /// <summary>
    /// 响应延迟 (毫秒，由健康检查服务更新)
    /// </summary>
    public int? LatencyMs { get; set; }
    
    /// <summary>
    /// 最后检查时间 (UTC)
    /// </summary>
    public DateTime? LastCheckTime { get; set; }
    
    // ========== 管理字段 ==========
    
    /// <summary>
    /// 显示顺序 (越小越靠前)
    /// </summary>
    public int DisplayOrder { get; set; } = 0;
    
    /// <summary>
    /// 是否启用 (禁用后不会显示在前台，也不会进行健康检查)
    /// </summary>
    public bool IsActive { get; set; } = true;
    
    /// <summary>
    /// 创建时间 (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
