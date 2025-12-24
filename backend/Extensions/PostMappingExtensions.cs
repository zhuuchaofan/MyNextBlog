using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Helpers;

namespace MyNextBlog.Extensions;

/// <summary>
/// 文章 DTO 映射扩展方法
/// 负责将数据库实体 (Post) 转换为前端所需的 DTO 对象
/// </summary>
public static class PostMappingExtensions
{
    /// <summary>
    /// 转换为列表页摘要 DTO
    /// </summary>
    /// <remarks>
    /// 自动提取 Markdown 内容的前 200 字作为摘要，并提取第一张图作为封面。
    /// </remarks>
    public static PostSummaryDto ToSummaryDto(this Post post)
    {
        return new PostSummaryDto(
            post.Id,
            post.Title,
            // 简单的摘要生成逻辑：截取前 150 个字符
            post.Content.Length > 150 ? post.Content.Substring(0, 150) + "..." : post.Content,
            post.Category?.Name ?? "Uncategorized", // 如果 Category 为空，显示默认值
            post.CategoryId,
            post.User?.Username ?? "Unknown",       // 如果 User 为空，显示 Unknown
            post.User?.AvatarUrl,
            post.CreateTime,
            post.UpdatedAt,                         // 最后修改时间
            MarkdownHelper.GetCoverImage(post.Content),        // 提取封面图
            post.Tags.Select(t => t.Name).ToList(), // 转换标签列表
            post.IsHidden,
            post.LikeCount,
            post.Series?.Name,                      // Series Name
            post.SeriesOrder                        // Series Order
        );
    }

    /// <summary>
    /// 转换为详情页完整 DTO
    /// </summary>
    /// <param name="commentCount">额外的评论总数数据 (需要单独查询)</param>
    /// <param name="seriesInfo">系列信息 (需要单独计算)</param>
    public static PostDetailDto ToDetailDto(this Post post, int commentCount = 0, PostSeriesDto? seriesInfo = null)
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
            post.UpdatedAt,                         // 最后修改时间
            post.Tags.Select(t => t.Name).ToList(),
            post.IsHidden,
            commentCount,
            post.LikeCount,
            post.SeriesId,    // 直接传递系列ID
            post.SeriesOrder, // 直接传递系列顺序
            seriesInfo // 传递系列信息
        );
    }

    private static string GetAuthorName(User? user)
    {
        if (user == null) return "Admin";
        return !string.IsNullOrEmpty(user.Nickname) ? user.Nickname : user.Username;
    }
}