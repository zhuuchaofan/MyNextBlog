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
            MarkdownHelper.GetExcerpt(post.Content), // 提取摘要
            post.Category?.Name ?? "未分类",
            post.CategoryId,
            GetAuthorName(post.User),
            post.User?.AvatarUrl,
            post.CreateTime,
            MarkdownHelper.GetCoverImage(post.Content), // 提取封面图
            post.Tags.Select(t => t.Name).ToList(),
            post.IsHidden,
            post.LikeCount
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
            post.Tags.Select(t => t.Name).ToList(),
            post.IsHidden,
            commentCount,
            post.LikeCount,
            seriesInfo // 传递系列信息
        );
    }

    private static string GetAuthorName(User? user)
    {
        if (user == null) return "Admin";
        return !string.IsNullOrEmpty(user.Nickname) ? user.Nickname : user.Username;
    }
}