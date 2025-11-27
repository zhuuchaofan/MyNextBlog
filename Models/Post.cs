using System.ComponentModel.DataAnnotations; // 引入这个是为了使用 [Required]

namespace MyTechBlog.Models;

public class Post
{
    public int Id { get; set; }
    
    [Required] // 必填项
    public string Title { get; set; } = string.Empty;
    
    public string Content { get; set; } = string.Empty; // 文章正文
    public DateTime CreateTime { get; set; } = DateTime.Now;
    
    // 关系：一篇文章可以有多个评论
    public List<Comment> Comments { get; set; } = new List<Comment>();
}