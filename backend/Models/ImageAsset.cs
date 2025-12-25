using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyNextBlog.Models;

public class ImageAsset
{
    public int Id { get; set; }

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// 存储服务中的唯一标识 (Key)，用于删除文件
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string StorageKey { get; set; } = string.Empty;

    public DateTime UploadTime { get; set; } = DateTime.UtcNow;

    public int Width { get; set; }
    public int Height { get; set; }

    /// <summary>
    /// 关联的文章 ID。如果为空，说明图片已上传但未保存到任何文章中。
    /// </summary>
    public int? PostId { get; set; }

    [ForeignKey("PostId")]
    public Post? Post { get; set; }
}
