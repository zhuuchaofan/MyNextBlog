using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Helpers;

namespace MyNextBlog.Extensions;

public static class PostMappingExtensions
{
    public static PostSummaryDto ToSummaryDto(this Post post)
    {
        return new PostSummaryDto(
            post.Id,
            post.Title,
            MarkdownHelper.GetExcerpt(post.Content),
            post.Category?.Name ?? "未分类",
            post.CategoryId,
            post.User?.Username ?? "Admin",
            post.User?.AvatarUrl,
            post.CreateTime,
            MarkdownHelper.GetCoverImage(post.Content),
            post.Tags.Select(t => t.Name).ToList(),
            post.IsHidden
        );
    }

    public static PostDetailDto ToDetailDto(this Post post, int commentCount = 0)
    {
        return new PostDetailDto(
            post.Id,
            post.Title,
            post.Content,
            post.Category?.Name ?? "未分类",
            post.CategoryId,
            post.User?.Username ?? "Admin",
            post.User?.AvatarUrl,
            post.CreateTime,
            post.Tags.Select(t => t.Name).ToList(),
            post.IsHidden,
            commentCount
        );
    }
}
