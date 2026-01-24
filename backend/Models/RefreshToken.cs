using System;

namespace MyNextBlog.Models;

/// <summary>
/// Refresh Token 实体 - 支持多设备登录
/// 每个用户可以拥有多个有效的 Refresh Token，每个对应一个设备/会话
/// </summary>
public class RefreshToken
{
    /// <summary>
    /// Token ID (主键)
    /// </summary>
    public int Id { get; set; }
    
    /// <summary>
    /// 关联的用户 ID
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// Token 的 SHA256 哈希值 (安全存储)
    /// </summary>
    public required string TokenHash { get; set; }
    
    /// <summary>
    /// Token 过期时间
    /// </summary>
    public DateTime ExpiryTime { get; set; }
    
    /// <summary>
    /// 设备标识 (可选) - 如 "Chrome on Windows", "Safari on iPhone"
    /// </summary>
    public string? DeviceInfo { get; set; }
    
    /// <summary>
    /// Token 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }
    
    /// <summary>
    /// 最后使用时间 (用于清理长期未使用的 Token)
    /// </summary>
    public DateTime LastUsedAt { get; set; }
    
    /// <summary>
    /// 软删除：撤销时间戳（轮换时标记，非物理删除）
    /// 用于支持并发刷新的 10 秒宽限期
    /// </summary>
    public DateTime? RevokedAt { get; set; }
    
    /// <summary>
    /// 检查 Token 是否有效（含 10 秒宽限期）
    /// </summary>
    /// <param name="now">当前时间</param>
    /// <returns>有效条件：未过期 AND (未撤销 OR 撤销后 10 秒内)</returns>
    public bool IsActive(DateTime now)
    {
        return now < ExpiryTime && 
               (RevokedAt == null || now < RevokedAt.Value.AddSeconds(10));
    }
    
    // 导航属性
    public User User { get; set; } = null!;
}
