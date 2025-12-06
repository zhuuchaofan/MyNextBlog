using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

// 列表页使用的精简 DTO (record 类型)
public record PostSummaryDto(
    int Id,
    string Title,
    string Excerpt, // 摘要 (从 Content 提取)
    string CategoryName,
    int? CategoryId,
    string AuthorName,
    string? AuthorAvatar, // 作者头像
    DateTime CreateTime,
    string? CoverImage, // 封面图 (从 Content 提取)
    List<string> Tags,
    bool IsHidden
);

// 详情页使用的完整 DTO
public record PostDetailDto(
    int Id,
    string Title,
    string Content,
    string CategoryName,
    int? CategoryId,
    string AuthorName,
    string? AuthorAvatar, // 作者头像
    DateTime CreateTime,
    List<string> Tags,
    bool IsHidden
);

// 创建文章 DTO
public record CreatePostDto(
    [Required(ErrorMessage = "标题不能为空")] string Title,
    [Required(ErrorMessage = "内容不能为空")] string Content,
    int? CategoryId,
    List<string>? Tags // 接收标签名称列表
);

// 更新文章 DTO
public record UpdatePostDto(
    [Required(ErrorMessage = "标题不能为空")] string Title,
    [Required(ErrorMessage = "内容不能为空")] string Content,
    int? CategoryId,
    List<string>? Tags,
    bool IsHidden
);
