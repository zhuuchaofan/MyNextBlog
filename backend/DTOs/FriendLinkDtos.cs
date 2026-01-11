// ============================================================================
// DTOs/FriendLinkDtos.cs - 友链数据传输对象
// ============================================================================
// 定义友链相关的 DTO，用于 API 层数据传输。
// 使用 record 类型确保不可变性。

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

/// <summary>
/// 友链展示 DTO (用于前台列表展示)
/// </summary>
/// <param name="Id">友链 ID</param>
/// <param name="Name">友站名称</param>
/// <param name="Url">友站 URL</param>
/// <param name="Description">友站描述</param>
/// <param name="AvatarUrl">头像 URL</param>
/// <param name="IsOnline">是否在线</param>
/// <param name="LatencyMs">响应延迟 (ms)</param>
/// <param name="LastCheckTime">最后检查时间</param>
/// <param name="DisplayOrder">显示顺序</param>
public record FriendLinkDto(
    int Id,
    string Name,
    string Url,
    string? Description,
    string? AvatarUrl,
    bool IsOnline,
    int? LatencyMs,
    DateTime? LastCheckTime,
    int DisplayOrder
);

/// <summary>
/// 友链管理 DTO (用于管理后台，包含更多字段)
/// </summary>
public record FriendLinkAdminDto(
    int Id,
    string Name,
    string Url,
    string? Description,
    string? AvatarUrl,
    bool IsOnline,
    int? LatencyMs,
    DateTime? LastCheckTime,
    int DisplayOrder,
    bool IsActive,
    DateTime CreatedAt
);

/// <summary>
/// 创建友链 DTO
/// </summary>
/// <param name="Name">友站名称 (必填)</param>
/// <param name="Url">友站 URL (必填)</param>
/// <param name="Description">友站描述</param>
/// <param name="AvatarUrl">头像 URL</param>
/// <param name="DisplayOrder">显示顺序 (留空或传 0 将自动递增)</param>
public record CreateFriendLinkDto(
    [Required] string Name,
    [Required] [Url] string Url,
    string? Description,
    string? AvatarUrl,
    [Range(0, int.MaxValue, ErrorMessage = "显示顺序不能为负数")] int DisplayOrder = 0
);

/// <summary>
/// 更新友链 DTO
/// </summary>
public record UpdateFriendLinkDto(
    [Required] string Name,
    [Required] [Url] string Url,
    string? Description,
    string? AvatarUrl,
    [Range(0, int.MaxValue, ErrorMessage = "显示顺序不能为负数")] int DisplayOrder,
    bool IsActive
);
