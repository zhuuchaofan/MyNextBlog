// `using` 语句用于导入必要的命名空间
using MyNextBlog.Models;  // 引入领域模型（Comment）
using MyNextBlog.DTOs;    // 引入数据传输对象

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Mappers;

/// <summary>
/// `CommentMappers` 是一个静态类，提供评论实体到 DTO 的映射委托。
/// 
/// **设计模式**: Func 委托模式
/// **目的**: 
///   - 统一管理评论的 DTO 映射逻辑，避免在 Controller 和 Service 中重复代码
///   - 提供类型安全的映射函数，比 AutoMapper 更轻量且性能更好
///   - 支持递归映射（嵌套评论）
/// </summary>
public static class CommentMappers
{
    /// <summary>
    /// 标准评论 DTO 映射委托（含子评论）
    /// 
    /// **使用场景**: 公开评论列表、评论详情
    /// **特点**: 支持递归映射子评论（ParentId 关系）
    /// </summary>
    /// <remarks>
    /// 使用 `Func<Comment, CommentDto>` 委托类型:
    ///   - 输入: Comment 实体
    ///   - 输出: CommentDto
    ///   - 优势: 
    ///     * 可以在 LINQ 的 `.Select()` 中直接使用
    ///     * 编译器优化内联调用，性能接近手写代码
    ///     * 类型安全，IDE 自动提示
    /// </remarks>
    public static readonly Func<Comment, CommentDto> ToDto = c => new CommentDto(
        c.Id,
        GetAuthorName(c),
        c.Content,
        c.CreateTime.ToString("yyyy/MM/dd HH:mm"),
        c.User?.AvatarUrl,
        c.ParentId,
        // 递归映射子评论：使用相同的委托处理 Children 集合
        // 这里展示了委托的强大之处：可以自引用
        // 使用 ?? 处理可能的 null，避免编译警告
        (c.Children ?? Enumerable.Empty<Comment>()).Select(ToDto!).ToList()
    );

    /// <summary>
    /// 管理员视图 DTO 映射委托
    /// 
    /// **使用场景**: 后台管理评论列表
    /// **特点**: 包含敏感信息（GuestEmail、IsApproved）
    /// </summary>
    public static readonly Func<Comment, AdminCommentDto> ToAdminDto = c => new AdminCommentDto(
        c.Id,
        c.Content,
        c.CreateTime,
        c.GuestName,
        c.GuestEmail,        // 管理员可见访客邮箱
        c.IsApproved,        // 审核状态
        c.Post?.Title,       // 所属文章标题（方便管理员识别）
        c.PostId,
        c.User?.AvatarUrl
    );

    /// <summary>
    /// 简化评论摘要映射（仅基本信息）
    /// 
    /// **使用场景**: 评论计数、通知列表等轻量级场景
    /// **特点**: 仅包含 ID、作者名、时间
    /// </summary>
    public static readonly Func<Comment, CommentSummaryDto> ToSummary = c => new CommentSummaryDto(
        c.Id,
        GetAuthorName(c),
        c.CreateTime
    );

    /// <summary>
    /// 获取评论作者名称的辅助方法
    /// 
    /// **业务规则**:
    ///   1. 优先使用登录用户的昵称（Nickname）
    ///   2. 如果昵称为空，使用用户名（Username）
    ///   3. 如果是访客评论，使用访客名称（GuestName）
    ///   4. 兜底显示"匿名"
    /// </summary>
    /// <param name="c">评论实体</param>
    /// <returns>作者显示名称</returns>
    private static string GetAuthorName(Comment c)
    {
        // 情况 1: 登录用户评论
        if (c.User != null)
            return !string.IsNullOrEmpty(c.User.Nickname) 
                ? c.User.Nickname 
                : c.User.Username;
        
        // 情况 2: 访客评论
        if (!string.IsNullOrEmpty(c.GuestName))
            return c.GuestName;
        
        // 情况 3: 兜底（理论上不应出现）
        return "匿名";
    }
}
