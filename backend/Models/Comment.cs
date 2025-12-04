using System.ComponentModel.DataAnnotations;

namespace MyTechBlog.Models;

public class Comment
{
    public int Id { get; set; }
    
    [Required]
    public string Content { get; set; } = string.Empty;
    public DateTime CreateTime { get; set; } = DateTime.Now;

    // 关系：属于哪篇文章
    public int PostId { get; set; }
    public Post? Post { get; set; }

    // 游客信息 (因为允许匿名，所以是选填)
    public string? GuestName { get; set; } 
    public string? GuestEmail { get; set; }
}