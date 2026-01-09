// ============================================================================
// Models/Memo.cs - Memo 模型
// ============================================================================
// 轻量级动态/说说，类似微博/碎碎念。
// 纯文本内容 + 图片 URL 列表 (JSONB 存储)。

using System.ComponentModel.DataAnnotations.Schema;

namespace MyNextBlog.Models;

/// <summary>
/// Memo 模型 - 轻量级动态/说说
/// </summary>
public class Memo
{
    /// <summary>
    /// 主键 ID
    /// </summary>
    public int Id { get; set; }
    
    // ========== 内容 ==========
    
    /// <summary>
    /// 文本内容 (纯文本，不支持 Markdown)
    /// </summary>
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// 图片 URL 列表 (JSONB 存储，最多 9 张)
    /// </summary>
    [Column(TypeName = "jsonb")]
    public List<string> ImageUrls { get; set; } = [];
    
    // ========== 元数据 ==========
    
    /// <summary>
    /// 来源 (Web / API / Shortcut)
    /// </summary>
    public string Source { get; set; } = "Web";
    
    /// <summary>
    /// 是否公开
    /// </summary>
    public bool IsPublic { get; set; } = true;
    
    // ========== 时间戳 ==========
    
    /// <summary>
    /// 创建时间 (UTC)
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 更新时间 (UTC)
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
