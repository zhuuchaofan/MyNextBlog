// ============================================================================
// DTOs/CommentDtos.cs - 评论相关数据传输对象
// ============================================================================
// 此文件定义了评论模块的 DTO，用于 API 请求/响应的数据结构。
//
// **DTO 分类**:
//   - `CreateCommentDto`: 创建评论请求 (带验证)
//   - `CommentDto`: 评论详情响应 (含嵌套子评论)

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解，用于输入验证

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// 创建评论请求 DTO
/// 
/// **验证规则**:
///   - PostId: 必填，目标文章 ID
///   - Content: 必填，最大 1000 字符
///   - GuestName: 可选，最大 50 字符
///   - ParentId: 可选，用于回复评论
/// </summary>
public record CreateCommentDto(
    [Required]
    int PostId,

    [Required(ErrorMessage = "评论内容不能为空")]
    [StringLength(1000, ErrorMessage = "评论内容不能超过1000个字符")]
    string Content,

    [StringLength(50)]
    [RegularExpression(@"^[\p{L}\p{N}_\- ]{0,50}$", ErrorMessage = "昵称包含非法字符")]
    string? GuestName,

    int? ParentId
);

/// <summary>
/// 评论 DTO - 公开 API 响应
/// </summary>
public record CommentDto(
    int Id,
    string GuestName,
    string Content,
    DateTime CreateTime,  // 使用 DateTime，由全局 UtcDateTimeConverter 序列化为 ISO 8601 + Z
    string? UserAvatar,
    int? ParentId,
    List<CommentDto> Children
);
