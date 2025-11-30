namespace ConsoleApp1;

using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;

public class R2Uploader
{
    // 配置信息 (实际开发中这些应该放在 appsettings.json 里)
    private const string AccessKey = "6babc14c529ae422d16e382c43c574d7";
    private const string SecretKey = "d7929a0e59135fae1e528a322fbcb64ee5e3a63f415e20b89095ff78b7f7a814";
    private const string AccountId = "ccc217f815202205d4173146be11b951";
    private const string BucketName = "my-blog-assets"; // 你的存储桶名字

    public async Task UploadFileAsync(string filePath, string keyName)
    {
        // 1. 组装 R2 的服务地址
        // R2 的 API 端点格式是: https://<AccountID>.r2.cloudflarestorage.com
        var serviceUrl = $"https://ccc217f815202205d4173146be11b951.r2.cloudflarestorage.com";

        // 2. 配置 S3 客户端
        var config = new AmazonS3Config
        {
            ServiceURL = serviceUrl,
            // 这一点很重要：因为我们用的不是 AWS 而是 R2，不需要根据 Region 推断端点
            // 虽然 R2 也有 Region 概念（通常是 auto），但指定 URL 足矣
        };

        // 3. 创建客户端实例
        using var client = new AmazonS3Client(AccessKey, SecretKey, config);

        try
        {
            // 4. 准备上传请求
            var putRequest = new PutObjectRequest
            {
                BucketName = BucketName,
                Key = keyName, // 文件名，例如: "2023/11/test-image.jpg"
                FilePath = filePath, // 本地文件路径
                DisablePayloadSigning = true // R2 推荐配置：禁用 Payload 签名以提升性能（可选，但推荐）
            };

            // 5. 执行上传
            var response = await client.PutObjectAsync(putRequest);

            Console.WriteLine((object?)$"上传成功! HTTP状态码: {response.HttpStatusCode}");
        }
        catch (AmazonS3Exception e)
        {
            Console.WriteLine($"AWS S3 错误: {e.Message}");
        }
        catch (Exception e)
        {
            Console.WriteLine($"发生未知错误: {e.Message}");
        }
    }
}