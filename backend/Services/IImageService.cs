namespace MyNextBlog.Services;

public interface IImageService
{
    /// <summary>
    /// 记录新上传的图片（此时未关联文章）
    /// </summary>
    Task RecordImageAsync(string url, string storageKey);

    /// <summary>
    /// 解析文章内容，将引用的图片与文章关联
    /// </summary>
    /// <param name="postId">文章ID</param>
    /// <param name="content">Markdown内容</param>
    Task AssociateImagesAsync(int postId, string content);

    /// <summary>
    /// 删除文章关联的所有图片（包括云端文件和数据库记录）
    /// </summary>
    /// <param name="postId">文章ID</param>
    Task DeleteImagesForPostAsync(int postId);
    
    /// <summary>
    /// 清理过期且未关联的图片（如24小时前的僵尸图）
    /// </summary>
    Task<int> CleanupOrphanedImagesAsync();
}