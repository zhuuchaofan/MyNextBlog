using Amazon.S3;
using Amazon.S3.Transfer;
using Amazon.S3.Model;

namespace MyNextBlog.Services;

public class R2StorageService : IStorageService
{
    private readonly string _serviceUrl;
    private readonly string _accessKey;
    private readonly string _secretKey;
    private readonly string _bucketName;
    private readonly string _publicDomain;

    public R2StorageService(IConfiguration configuration)
    {
        var r2Config = configuration.GetSection("CloudflareR2");

        _serviceUrl = r2Config["ServiceUrl"] ?? throw new ArgumentNullException("CloudflareR2:ServiceUrl is missing");
        _accessKey = r2Config["AccessKey"] ?? throw new ArgumentNullException("CloudflareR2:AccessKey is missing");
        _secretKey = r2Config["SecretKey"] ?? throw new ArgumentNullException("CloudflareR2:SecretKey is missing");
        _bucketName = r2Config["BucketName"] ?? throw new ArgumentNullException("CloudflareR2:BucketName is missing");
        _publicDomain = r2Config["PublicDomain"] ?? ""; // 允许为空，但在实际使用中需要配置
    }

    public async Task<ImageUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType, string? customPrefix = null)
    {
        var config = new AmazonS3Config
        {
            ServiceURL = _serviceUrl,
        };

        using var client = new AmazonS3Client(_accessKey, _secretKey, config);

        // 确定存储路径前缀：如果有自定义前缀就用自定义的，否则按日期归档
        var prefix = string.IsNullOrEmpty(customPrefix) 
            ? DateTime.Now.ToString("yyyy/MM/dd") 
            : customPrefix.TrimEnd('/'); // 去掉末尾斜杠以防双重斜杠

        // 生成唯一的 Key
        // 格式: {prefix}/{guid}{ext}
        var keyName = $"{prefix}/{Guid.NewGuid()}{Path.GetExtension(fileName)}";

        var putRequest = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = keyName,
            InputStream = fileStream,
            ContentType = contentType,
            DisablePayloadSigning = true // R2 推荐配置
        };

        await client.PutObjectAsync(putRequest);

        string fileUrl;
        // 构造返回的 URL
        // 如果 PublicDomain 未配置，这是一个提示
        if (string.IsNullOrEmpty(_publicDomain) || _publicDomain.Contains("your-public-r2-domain"))
        {
             fileUrl = $"/error/configure-public-domain/{keyName}"; 
        }
        else
        {
            // 确保域名末尾没有斜杠，避免双斜杠
            var baseUrl = _publicDomain.TrimEnd('/');
            fileUrl = $"{baseUrl}/{keyName}";
        }

        return new ImageUploadResult
        {
            Url = fileUrl,
            StorageKey = keyName
        };
    }

    public async Task DeleteAsync(string storageKey)
    {
        var config = new AmazonS3Config
        {
            ServiceURL = _serviceUrl,
        };

        using var client = new AmazonS3Client(_accessKey, _secretKey, config);

        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = _bucketName,
            Key = storageKey
        };

        await client.DeleteObjectAsync(deleteRequest);
    }
}
