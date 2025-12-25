using Amazon.S3;
using Amazon.S3.Transfer;
using Amazon.S3.Model;
using Polly;
using Polly.Retry;

namespace MyNextBlog.Services;

/// <summary>
/// Cloudflare R2 存储服务实现
/// 使用 AWS SDK for .NET (S3 协议兼容) 与 R2 进行交互
/// </summary>
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
        _publicDomain = r2Config["PublicDomain"] ?? ""; 
    }

    /// <summary>
    /// 上传文件到对象存储
    /// </summary>
    /// <param name="fileStream">文件流</param>
    /// <param name="fileName">原始文件名 (用于提取扩展名)</param>
    /// <param name="contentType">MIME 类型 (如 image/jpeg)</param>
    /// <param name="customPrefix">可选：自定义文件夹路径 (如 "avatars", "backups")。若为空则按日期归档。</param>
    /// <returns>包含访问 URL 和 StorageKey 的结果对象</returns>
    public async Task<ImageUploadResult> UploadAsync(Stream fileStream, string fileName, string contentType, string? customPrefix = null)
    {
        var config = new AmazonS3Config
        {
            ServiceURL = _serviceUrl,
        };

        using var client = new AmazonS3Client(_accessKey, _secretKey, config);

        // 策略 1: 确定文件夹路径
        // 如果调用方指定了 customPrefix (如头像上传)，则使用它；
        // 否则默认按 yyyy/MM/dd 格式归档，方便按时间管理。
        var prefix = string.IsNullOrEmpty(customPrefix) 
            ? DateTime.UtcNow.ToString("yyyy/MM/dd") 
            : customPrefix.TrimEnd('/');

        // 策略 2: 安全重命名
        // 永远不要直接使用用户上传的 fileName 作为存储键！
        // 1. 防止路径遍历攻击 (../../etc/passwd)
        // 2. 防止同名文件覆盖
        // 3. 处理特殊字符兼容性
        // 解决方案：使用 GUID + 原始扩展名
        var keyName = $"{prefix}/{Guid.NewGuid()}{Path.GetExtension(fileName)}";

        var putRequest = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = keyName,
            InputStream = fileStream,
            ContentType = contentType,
            DisablePayloadSigning = true // R2/Cloudflare 特有配置，提升性能
        };

        // 执行上传
        // 使用 Polly 重试策略: 最多重试 3 次，每次指数退避 (2^n 秒)
        var pipeline = new ResiliencePipelineBuilder()
            .AddRetry(new RetryStrategyOptions
            {
                MaxRetryAttempts = 3,
                BackoffType = DelayBackoffType.Exponential,
                Delay = TimeSpan.FromSeconds(2),
                OnRetry = static args =>
                {
                    Console.WriteLine($"[R2 Upload Retry] Attempt {args.AttemptNumber} failed. Waiting {args.RetryDelay}...");
                    return default;
                }
            })
            .Build(); // 注意: 实际项目中应将 Pipeline 注册为单例

        // 使用 Pipeline 执行
        await pipeline.ExecuteAsync(async cancellationToken => 
        {
            // 注意: Stream 在重试前必须重置位置，否则重试上传的是空数据或错误数据
            if (fileStream.CanSeek)
            {
                fileStream.Position = 0;
            }
            await client.PutObjectAsync(putRequest, cancellationToken);
        });

        // 构造公开访问链接
        string fileUrl;
        if (string.IsNullOrEmpty(_publicDomain) || _publicDomain.Contains("your-public-r2-domain"))
        {
             // 配置未就绪时的容错处理
             fileUrl = $"/error/configure-public-domain/{keyName}"; 
        }
        else
        {
            var baseUrl = _publicDomain.TrimEnd('/');
            fileUrl = $"{baseUrl}/{keyName}";
        }

        return new ImageUploadResult
        {
            Url = fileUrl,
            StorageKey = keyName
        };
    }

    /// <summary>
    /// 删除文件
    /// </summary>
    /// <param name="storageKey">文件的唯一键 (Key)</param>
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