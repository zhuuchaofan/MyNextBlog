using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

public record CreateCommentDto(
    [Required]
    int PostId,

    [Required(ErrorMessage = "评论内容不能为空")]
    [StringLength(1000, ErrorMessage = "评论内容不能超过1000个字符")]
    string Content,

    [StringLength(50, ErrorMessage = "昵称不能超过50个字符")]
    string? GuestName,

    int? ParentId
);

public record CommentDto(
    int Id,
    string GuestName,
    string Content,
    string CreateTime,
    string? UserAvatar,
    int? ParentId,
    List<CommentDto> Children
);
