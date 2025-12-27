// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// `AdminCommentDto` 是管理员专用的评论数据传输对象。
/// 
/// **使用场景**: 后台管理页面的评论列表
/// **特点**: 包含敏感信息（访客邮箱、审核状态）
/// **权限要求**: 仅限 Admin 角色访问的接口可以返回此 DTO
/// </summary>
/// <remarks>
/// 使用 `record` 类型的优势:
///   - 值类型语义（基于内容的相等性比较）
///   - 不可变性（所有属性为 init-only）
///   - 简洁的主构造函数语法
///   - 自动生成 ToString()、GetHashCode()、Equals() 方法
/// </remarks>
/// <param name="Id">评论唯一标识符</param>
/// <param name="Content">评论内容（Markdown 格式）</param>
/// <param name="CreateTime">评论发表时间（UTC）</param>
/// <param name="GuestName">访客昵称（如果是登录用户则为 null）</param>
/// <param name="GuestEmail">访客邮箱（管理员可见，用于联系或反垃圾）</param>
/// <param name="IsApproved">审核状态（true=已通过，false=待审核）</param>
/// <param name="PostTitle">所属文章标题（方便管理员快速定位）</param>
/// <param name="PostId">所属文章 ID</param>
/// <param name="UserAvatar">评论者头像 URL（登录用户或默认头像）</param>
public record AdminCommentDto(
    int Id,
    string Content,
    DateTime CreateTime,
    string? GuestName,
    string? GuestEmail,
    bool IsApproved,
    string? PostTitle,
    int PostId,
    string? UserAvatar
);
