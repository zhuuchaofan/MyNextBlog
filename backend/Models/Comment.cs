// ============================================================================
// Models/Comment.cs - 评论实体
// ============================================================================
// 此实体映射 `Comments` 表，存储文章的评论数据。
//
// **特性**:
//   - 树形结构: 支持嵌套回复 (Infinite Nesting)
//   - 混合身份: 支持 注册用户 (UserId) 和 匿名游客 (GuestName)
//   - 审核机制: IsApproved 字段控制显示

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Models;

/// <summary>
/// `Comment` 实体代表用户或游客发表的评论。
/// 
/// **关系**:
///   - `Post`: 多对一 (必填)
///   - `User`: 多对一 (可选，游客为 null)
///   - `Parent`/`Children`: 自引用 (实现无限层级)
/// </summary>
public class Comment
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;

    // 关系：属于哪篇文章
    public int PostId { get; set; }
    public Post? Post { get; set; }

    // 游客信息 (因为允许匿名，所以是选填)
    [MaxLength(100)]
    public string? GuestName { get; set; } 
    [MaxLength(100)]
    public string? GuestEmail { get; set; }

    // 关联注册用户 (如果是登录用户评论)
    public int? UserId { get; set; }
    public User? User { get; set; }

    // 关系：父评论 ID (用于实现回复/盖楼)
    public int? ParentId { get; set; }
    public Comment? Parent { get; set; } // 导航属性：指向父评论
    public List<Comment> Children { get; set; } = new List<Comment>(); // 导航属性：子评论列表

    // 审核状态：默认不需要审核 (true)，如果开启强审核则设为 false
    public bool IsApproved { get; set; } = true;
}