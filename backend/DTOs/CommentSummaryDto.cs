// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// `CommentSummaryDto` 是评论摘要数据传输对象。
/// 
/// **使用场景**: 评论计数、通知列表、简化版评论展示
/// **特点**: 仅包含最基本的信息，减少数据传输量
/// </summary>
/// <param name="Id">评论唯一标识符</param>
/// <param name="AuthorName">评论作者显示名称</param>
/// <param name="CreateTime">评论发表时间</param>
public record CommentSummaryDto(
    int Id,
    string AuthorName,
    DateTime CreateTime
);
