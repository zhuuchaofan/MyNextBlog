// `using` 语句用于导入必要的命名空间。
using System.ComponentModel.DataAnnotations; // 引入数据注解命名空间，用于在 DTO 属性上添加验证规则。

// `namespace` 声明了当前文件中的代码所属的命名空间。
namespace MyNextBlog.DTOs;

/// <summary>
/// **数据传输对象 (Data Transfer Object, DTO)** 概念：
/// DTO 是一种用于在应用程序的不同层（例如，控制器和视图之间，或者 API 客户端和服务器之间）
/// 传输数据的对象。它只包含数据，不包含任何业务逻辑。
///
/// **为什么使用 DTO 而不是直接使用领域模型 (Entity Model)？**
/// 1.  **解耦**: 领域模型 (`Post.cs`) 通常与数据库结构紧密相关，可能包含导航属性、验证逻辑等。
///     DTO 则专注于 API 接口的输入和输出格式，前端只需要关心 DTO 的结构。
///     即使数据库模型改变，只要 DTO 保持不变，API 接口就不会受影响。
/// 2.  **安全性/数据剪裁**: 领域模型可能包含敏感信息（如用户密码哈希）或过多的数据（如文章的完整内容在列表页不需要）。
///     DTO 可以精确控制暴露给客户端的数据，避免过度暴露（Over-fetching）或数据泄露。
/// 3.  **验证**: 可以在 DTO 上直接使用 `[Required]` 等数据注解来定义 API 接口的输入验证规则，
///     使验证逻辑清晰且与业务逻辑分离。
/// 4.  **性能**: 传输更少的数据可以减少网络带宽消耗，提高 API 响应速度。
///
/// **C# `record` 类型**：
/// C# 9 引入的 `record` 类型是一种特殊的类类型，主要用于存储数据。
/// 它自动提供了许多方便的功能，例如：
///   - 默认的不可变性（Immutable）：一旦创建，属性值就不能更改（除非手动提供 `set` 访问器）。
///   - 值相等性：`record` 比较时是基于属性的值，而不是对象的引用（与 `class` 不同）。
///   - `with` 表达式：方便创建修改了部分属性的新 `record` 实例。
///   - 简洁的语法：像下面这样可以直接在构造函数中定义属性。
/// 这些特性使得 `record` 非常适合用作 DTO。
/// </summary>

/// <summary>
/// `PostSummaryDto` 是用于文章列表页显示的精简数据传输对象。
/// 它只包含文章的概览信息，避免传输完整内容，优化性能。
/// </summary>
public record PostSummaryDto(
    int Id,                                  // 文章 ID
    string Title,                            // 文章标题
    string Excerpt,                          // 文章摘要，通常从 `Content` 中提取一部分
    string CategoryName,                     // 文章所属分类的名称
    int? CategoryId,                         // 文章所属分类的 ID (可空)
    string AuthorName,                       // 文章作者的用户名
    string? AuthorAvatar,                    // 文章作者的头像 URL (可空)
    DateTime CreateTime,                     // 文章创建时间
    string? CoverImage,                      // 文章封面图片的 URL (可空，从 `Content` 中提取)
    List<string> Tags,                       // 文章关联的标签名称列表
    bool IsHidden,                           // 文章是否隐藏 (true 为隐藏/草稿，false 为公开)
    int LikeCount                            // 文章点赞数
);

/// <summary>
/// `PostDetailDto` 是用于文章详情页显示的完整数据传输对象。
/// 它包含文章的所有详细信息，包括完整的正文内容。
/// </summary>
public record PostDetailDto(
    int Id,                                  // 文章 ID
    string Title,                            // 文章标题
    string Content,                          // 文章完整正文内容
    string CategoryName,                     // 文章所属分类的名称
    int? CategoryId,                         // 文章所属分类的 ID (可空)
    string AuthorName,                       // 文章作者的用户名
    string? AuthorAvatar,                    // 文章作者的头像 URL (可空)
    DateTime CreateTime,                     // 文章创建时间
    List<string> Tags,                       // 文章关联的标签名称列表
    bool IsHidden,                           // 文章是否隐藏
    int CommentCount,                        // 文章的评论总数
    int LikeCount,                           // 文章点赞数
    PostSeriesDto? SeriesInfo                // 系列信息 (可空)
);

// 系列信息 DTO (后端计算好上一篇下一篇)
public record PostSeriesDto(
    int Id,              // 系列ID
    string Name,         // 系列名
    int TotalCount,      // 总篇数
    int CurrentOrder,    // 当前是第几篇 (0-based or 1-based? Let's use 1-based index for display)
    PostLinkDto? Prev,   // 上一篇
    PostLinkDto? Next    // 下一篇
);

// 简化的文章链接 DTO
public record PostLinkDto(
    int Id,
    string Title
);

/// <summary>
/// `CreatePostDto` 是用于创建新文章时，接收客户端请求体的数据传输对象。
/// 它定义了创建文章所需的最小且必要的字段，并包含输入验证规则。
/// </summary>
public record CreatePostDto(
    // `[Required(ErrorMessage = "...")`: 数据注解，表示此字段在 HTTP 请求体中是必填的。
    // 如果客户端没有提供 `Title` 或 `Content`，ASP.NET Core 会自动返回 `400 Bad Request` 响应，
    // 包含指定的错误消息。
    [Required(ErrorMessage = "标题不能为空")] string Title,    // 必填：新文章的标题
    [Required(ErrorMessage = "内容不能为空")] string Content,  // 必填：新文章的正文内容
    int? CategoryId,                                         // 可选：新文章所属分类的 ID
    List<string>? Tags                                       // 可选：新文章关联的标签名称列表
);

/// <summary>
/// `UpdatePostDto` 是用于更新现有文章时，接收客户端请求体的数据传输对象。
/// 它定义了更新文章时可修改的字段，并包含输入验证规则。
/// </summary>
public record UpdatePostDto(
    [Required(ErrorMessage = "标题不能为空")] string Title,    // 必填：更新后的文章标题
    [Required(ErrorMessage = "内容不能为空")] string Content,  // 必填：更新后的文章正文内容
    int? CategoryId,                                         // 可选：更新后的文章分类 ID
    List<string>? Tags,                                      // 可选：更新后的文章标签列表
    bool IsHidden                                            // 更新后的文章可见性状态
);
