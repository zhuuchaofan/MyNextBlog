namespace MyNextBlog.Services;

public class ImageUploadResult
{
    public string Url { get; set; } = string.Empty;
    public string StorageKey { get; set; } = string.Empty;
}

public interface IStorageService
{
    /// <summary>
    /// 上传文件到存储服务
    /// </summary>
    /// <param name="fileStream">文件流</param>
    /// <param name="fileName">文件名</param>
    /// <param name="contentType">MIME 类型</param>
    /// <param name="customPrefix">自定义存储前缀（文件夹），若为空则默认按日期归档</param>
    Task<ImageUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType, string? customPrefix = null);

    /// <summary>
    /// 从存储服务删除文件
    /// </summary>
    Task DeleteAsync(string storageKey);
}
