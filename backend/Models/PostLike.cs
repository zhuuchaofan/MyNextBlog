using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyNextBlog.Models
{
    public class PostLike
    {
        [Key]
        public int Id { get; set; }

        public int PostId { get; set; }
        
        [ForeignKey("PostId")]
        public Post? Post { get; set; }

        // 如果是登录用户，记录 UserId
        public int? UserId { get; set; }
        
        [ForeignKey("UserId")]
        public User? User { get; set; }

        // 如果是游客，记录 IP 地址
        public string? IpAddress { get; set; }

        public DateTime CreateTime { get; set; } = DateTime.UtcNow;
    }
}
