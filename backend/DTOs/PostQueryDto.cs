namespace MyNextBlog.DTOs;

/// <summary>
/// 文章列表查询参数
/// </summary>
public record PostQueryDto(
    int Page = 1,
    int PageSize = 10,
    bool IncludeHidden = false,
    int? CategoryId = null,
    string? SearchTerm = null,
    string? TagName = null
);
