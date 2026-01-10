// ============================================================================
// DTOs/UserPresenceDto.cs - 用户在线状态数据传输对象
// ============================================================================
// 此文件定义了站长在线状态的 DTO，用于前端展示"数字分身"功能。
//
// **使用场景**:
//   - 前端轮询获取站长当前状态（编程/游戏/离线）
//   - 管理员手动设置状态覆盖

namespace MyNextBlog.DTOs;

/// <summary>
/// 用户在线状态 DTO
/// </summary>
/// <param name="Status">状态枚举: coding, gaming, listening, offline, custom</param>
/// <param name="Icon">Lucide 图标名称，如 "Code", "Gamepad2", "Moon"</param>
/// <param name="Message">展示文本，如 "Playing Black Myth: Wukong"</param>
/// <param name="Details">辅助信息，如 "在线 45 分钟"（可选）</param>
/// <param name="Timestamp">最后更新时间 (UTC)</param>
public record UserPresenceDto(
    string Status,
    string Icon,
    string Message,
    string? Details,
    DateTime Timestamp
);

/// <summary>
/// 用户在线状态 API 响应包装 (用于 Swagger 文档生成)
/// </summary>
/// <param name="Success">操作是否成功</param>
/// <param name="Data">用户状态数据</param>
public record UserPresenceResponse(
    bool Success,
    UserPresenceDto Data
);

/// <summary>
/// 手动状态覆盖请求 DTO (Admin)
/// </summary>
/// <param name="Status">自定义状态标识，如 "busy", "traveling"</param>
/// <param name="Message">展示消息，如 "闭关修炼中"</param>
/// <param name="ExpireAt">过期时间 (UTC)，过期后自动恢复检测</param>
public record SetPresenceOverrideDto(
    string Status,
    string? Message,
    DateTime? ExpireAt
);

