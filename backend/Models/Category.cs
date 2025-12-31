// ============================================================================
// Models/Category.cs - 分类实体
// ============================================================================
// 此实体映射 `Categories` 表，用于对文章进行主要归类。

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Models;

/// <summary>
/// `Category` 实体代表文章所属的分类（如 "技术", "生活"）。
/// 
/// **关系**: 一个 Category 可包含多个 Post (1对多)。
/// </summary>
public class Category
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty; // 分类名称，比如“技术”、“生活”

    // 关系：一个分类下有一堆文章
    public List<Post> Posts { get; set; } = new List<Post>();
}