// ============================================================================
// DTOs/MemoDtos.cs - Memo 数据传输对象
// ============================================================================
// 定义 Memo 相关的 DTO，包含 Keyset Pagination 支持。

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

/// <summary>
/// Memo 展示 DTO (用于前台列表)
/// </summary>
/// <param name="Id">Memo ID</param>
/// <param name="Content">文本内容</param>
/// <param name="ImageUrls">图片 URL 列表</param>
/// <param name="Source">来源</param>
/// <param name="CreatedAt">创建时间</param>
public record MemoDto(
    int Id,
    string Content,
    List<string> ImageUrls,
    string Source,
    DateTime CreatedAt
);

/// <summary>
/// Memo 管理 DTO (用于后台管理)
/// </summary>
public record MemoAdminDto(
    int Id,
    string Content,
    List<string> ImageUrls,
    string Source,
    bool IsPublic,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

/// <summary>
/// 创建 Memo DTO
/// </summary>
/// <param name="Content">文本内容 (必填)</param>
/// <param name="ImageUrls">图片 URL 列表</param>
/// <param name="Source">来源</param>
/// <param name="IsPublic">是否公开</param>
public record CreateMemoDto(
    [Required(ErrorMessage = "内容不能为空")]
    [MinLength(1, ErrorMessage = "内容不能为空")]
    [StringLength(5000, ErrorMessage = "内容不能超过5000个字符")]
    string Content,
    List<string>? ImageUrls = null,
    string Source = "Web",
    bool IsPublic = true
);

/// <summary>
/// 更新 Memo DTO
/// </summary>
public record UpdateMemoDto(
    [Required(ErrorMessage = "内容不能为空")]
    [MinLength(1, ErrorMessage = "内容不能为空")]
    [StringLength(5000, ErrorMessage = "内容不能超过5000个字符")]
    string Content,
    List<string>? ImageUrls = null,
    bool IsPublic = true
);

/// <summary>
/// Memo 分页结果 (Keyset Pagination)
/// </summary>
/// <param name="Items">Memo 列表</param>
/// <param name="NextCursor">下一页游标 (null 表示没有更多)</param>
public record MemoPageResult(
    List<MemoDto> Items,
    string? NextCursor
);
