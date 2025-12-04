namespace MyTechBlog.Services;

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
    Task<ImageUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType);

    /// <summary>
    /// 从存储服务删除文件
    /// </summary>
    Task DeleteAsync(string storageKey);
}
