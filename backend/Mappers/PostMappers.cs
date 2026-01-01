// ============================================================================
// Mappers/PostMappers.cs - 文章 DTO 映射委托
// ============================================================================
// 此文件提供文章实体到 DTO 的映射逻辑。
//
// **设计模式**: 静态方法 + Func 委托（与 CommentMappers 保持一致）
// **目的**: 统一管理文章的 DTO 映射逻辑
//
// **重构说明 (2026-01-01)**:
//   - 从 Extensions/PostMappingExtensions.cs 迁移而来
//   - 统一使用 Mappers/ 目录结构

// `using` 语句用于导入必要的命名空间
using MyNextBlog.DTOs;     // 数据传输对象
using MyNextBlog.Models;   // 领域模型
using MyNextBlog.Helpers;  // 辅助工具（MarkdownHelper）

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Mappers;

/// <summary>
/// `PostMappers` 是一个静态类，提供文章实体到 DTO 的映射方法。
/// 
/// **设计模式**: 静态方法 + Func 委托
/// **目的**: 
///   - 统一管理文章的 DTO 映射逻辑
///   - 与 CommentMappers 保持风格一致
/// </summary>
public static class PostMappers
{
    /// <summary>
    /// 转换为列表页摘要 DTO 的委托
    /// </summary>
    public static readonly Func<Post, PostSummaryDto> ToSummaryDto = p => new PostSummaryDto(
        p.Id,
        p.Title,
        // 简单的摘要生成逻辑：截取前 150 个字符
        p.Content.Length > 150 ? p.Content.Substring(0, 150) + "..." : p.Content,
        p.Category?.Name ?? "Uncategorized",
        p.CategoryId,
        GetAuthorName(p.User),
        p.User?.AvatarUrl,
        p.CreateTime,
        p.UpdatedAt,
        MarkdownHelper.GetCoverImage(p.Content),
        p.Tags.Select(t => t.Name).ToList(),
        p.IsHidden,
        p.LikeCount,
        p.Series?.Name,
        p.SeriesOrder
    );
    
    /// <summary>
    /// 转换为列表页摘要 DTO（精简版，用于相关文章推荐）
    /// </summary>
    /// <remarks>
    /// 与 ToSummaryDto 类似，但不包含完整标签列表，优化性能
    /// </remarks>
    public static PostSummaryDto ToSummaryDtoLite(Post p) => new(
        p.Id,
        p.Title,
        p.Content.Length > 100 ? p.Content.Substring(0, 100) + "..." : p.Content,
        p.Category?.Name ?? "Uncategorized",
        p.CategoryId,
        GetAuthorName(p.User),
        p.User?.AvatarUrl,
        p.CreateTime,
        p.UpdatedAt,
        MarkdownHelper.GetCoverImage(p.Content),
        p.Tags?.Select(t => t.Name).ToList() ?? [],
        p.IsHidden,
        p.LikeCount,
        p.Series?.Name,
        p.SeriesOrder
    );
    
    /// <summary>
    /// 转换为详情页完整 DTO
    /// </summary>
    /// <param name="post">文章实体</param>
    /// <param name="commentCount">评论总数（需要单独查询）</param>
    /// <param name="seriesInfo">系列信息（需要单独计算）</param>
    public static PostDetailDto ToDetailDto(Post post, int commentCount = 0, PostSeriesDto? seriesInfo = null)
    {
        return new PostDetailDto(
            post.Id,
            post.Title,
            post.Content,
            post.Category?.Name ?? "未分类",
            post.CategoryId,
            GetAuthorName(post.User),
            post.User?.AvatarUrl,
            post.CreateTime,
            post.UpdatedAt,
            post.Tags.Select(t => t.Name).ToList(),
            post.IsHidden,
            commentCount,
            post.LikeCount,
            post.SeriesId,
            post.SeriesOrder,
            seriesInfo
        );
    }
    
    /// <summary>
    /// 获取作者名称的辅助方法
    /// </summary>
    private static string GetAuthorName(User? user)
    {
        if (user == null) return "Admin";
        return !string.IsNullOrEmpty(user.Nickname) ? user.Nickname : user.Username;
    }
}
