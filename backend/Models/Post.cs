using System.ComponentModel.DataAnnotations; // 引入这个是为了使用 [Required]

namespace MyNextBlog.Models;

public class Post
{
    public int Id { get; set; }
    
    [Required] // 必填项
    public string Title { get; set; } = string.Empty;    // 文章标题
    
    public string Content { get; set; } = string.Empty; // 文章正文
    public DateTime CreateTime { get; set; } = DateTime.Now;
    // public DateTime？ FinalEditTime { get; set; } = DateTime.Now;    // 最后一次修改时间
    
    // 关系：一篇文章可以有多个评论
    public List<Comment> Comments { get; set; } = new List<Comment>();

    // 关系：一篇文章可以有多个标签 (多对多)
    public List<Tag> Tags { get; set; } = new();

    // 允许为空 (int?)，这样旧文章即使没有分类也不会报错
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public bool IsHidden { get; set; } = false;

    // 作者信息 (可空，兼容旧数据)
    public int? UserId { get; set; }
    public User? User { get; set; }
}