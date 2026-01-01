// ============================================================================
// Extensions/PostMappingExtensions.cs - 文章 DTO 映射扩展方法
// ============================================================================
// 此文件提供扩展方法风格的映射便捷接口。
//
// **重构说明 (2026-01-01)**:
//   - 实际映射逻辑已迁移到 Mappers/PostMappers.cs
//   - 此文件仅提供扩展方法语法糖，委托给 PostMappers

using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Mappers;  // 引用新的 Mappers

namespace MyNextBlog.Extensions;

/// <summary>
/// 文章 DTO 映射扩展方法
/// 
/// **注意**: 实际映射逻辑在 `Mappers/PostMappers.cs`，
///          此类仅提供扩展方法语法糖
/// </summary>
public static class PostMappingExtensions
{
    /// <summary>
    /// 转换为列表页摘要 DTO
    /// </summary>
    public static PostSummaryDto ToSummaryDto(this Post post)
        => PostMappers.ToSummaryDto(post);

    /// <summary>
    /// 转换为详情页完整 DTO
    /// </summary>
    public static PostDetailDto ToDetailDto(this Post post, int commentCount = 0, PostSeriesDto? seriesInfo = null)
        => PostMappers.ToDetailDto(post, commentCount, seriesInfo);
}