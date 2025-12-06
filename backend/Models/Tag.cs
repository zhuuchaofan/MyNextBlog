using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Models;

public class Tag
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    // 多对多关系：一个标签可以对应多篇文章
    public List<Post> Posts { get; set; } = new();
}
