// ============================================================================
// DTOs/SiteContentDtos.cs - 站点内容相关数据传输对象
// ============================================================================
// 此文件定义了站点配置模块使用的 DTO。

namespace MyNextBlog.DTOs;

/// <summary>
/// 站点配置 DTO
/// </summary>
/// <param name="Key">配置键</param>
/// <param name="Value">配置值</param>
/// <param name="Description">配置描述</param>
/// <param name="UpdatedAt">最后更新时间</param>
public record SiteContentDto(
    string Key,
    string Value,
    string? Description,
    DateTime? UpdatedAt
);
