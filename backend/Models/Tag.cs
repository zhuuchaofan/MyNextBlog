// ============================================================================
// Models/Tag.cs - 标签实体
// ============================================================================
// 此实体映射 `Tags` 表，用于给文章打标签。
// 
// **关系**: 多对多 (通过 PostTags 中间表，但 EF Core 可简化为 Posts 集合)

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Models;

/// <summary>
/// `Tag` 实体代表一个标签 keyword。
/// 用于对文章进行灵活的分类和聚合。
/// </summary>
public class Tag
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    // 多对多关系：一个标签可以对应多篇文章
    public List<Post> Posts { get; set; } = new();
}
