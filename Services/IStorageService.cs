namespace MyTechBlog.Services;

public interface IStorageService
{
    /// <summary>
    /// 上传文件到存储服务
    /// </summary>
    /// <param name="fileStream">文件流</param>
    /// <param name="fileName">文件名（包含扩展名）</param>
    /// <param name="contentType">文件MIME类型</param>
    /// <returns>文件的公开访问URL</returns>
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType);
}
