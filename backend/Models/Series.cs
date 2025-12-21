using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Models;

public class Series
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    // 导航属性：一个系列包含多篇文章
    public List<Post> Posts { get; set; } = new List<Post>();
}
