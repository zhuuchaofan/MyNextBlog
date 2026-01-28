using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 临时测试接口，用于验证 GCP 服务账号认证是否正常工作
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TestGcpController : ControllerBase
{
    private readonly ILogger<TestGcpController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    // Cloud Run URL (需要身份验证的服务)
    private const string CloudRunUrl = "https://genai-app--1-1769601404546-151587524132.us-central1.run.app";

    public TestGcpController(ILogger<TestGcpController> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// 测试 GCP 凭据是否加载成功
    /// </summary>
    [HttpGet("credentials")]
    [AllowAnonymous]
    public async Task<IActionResult> TestCredentials()
    {
        try
        {
            // 1. 检查环境变量
            var credPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
            if (string.IsNullOrEmpty(credPath))
            {
                return Ok(new { success = false, message = "GOOGLE_APPLICATION_CREDENTIALS 环境变量未设置" });
            }

            // 2. 检查文件是否存在
            if (!System.IO.File.Exists(credPath))
            {
                return Ok(new { success = false, message = $"凭据文件不存在: {credPath}" });
            }

            // 3. 尝试加载凭据
            var credential = await GoogleCredential.GetApplicationDefaultAsync();
            
            _logger.LogInformation("GCP 凭据加载成功，凭据路径: {Path}", credPath);

            return Ok(new
            {
                success = true,
                message = "GCP 凭据加载成功",
                credentialPath = credPath,
                fileExists = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "加载 GCP 凭据失败");
            return Ok(new { success = false, message = $"加载凭据失败: {ex.Message}" });
        }
    }

    /// <summary>
    /// 测试访问受保护的 Cloud Run 服务
    /// </summary>
    [HttpGet("call-cloud-run")]
    [AllowAnonymous]
    public async Task<IActionResult> CallCloudRun()
    {
        try
        {
            // 1. 获取默认凭据
            var credential = await GoogleCredential.GetApplicationDefaultAsync();

            // 2. 生成 OIDC Token (Target Audience 必须是目标服务的 URL)
            var oidcToken = await credential.GetOidcTokenAsync(OidcTokenOptions.FromTargetAudience(CloudRunUrl));
            var tokenString = await oidcToken.GetAccessTokenAsync();

            _logger.LogInformation("成功获取 OIDC Token (长度: {Length})", tokenString.Length);

            // 3. 使用 Token 调用 Cloud Run
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenString);

            var response = await client.GetAsync(CloudRunUrl);
            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Cloud Run 响应状态: {StatusCode}", response.StatusCode);

            return Ok(new
            {
                success = response.IsSuccessStatusCode,
                statusCode = (int)response.StatusCode,
                statusText = response.StatusCode.ToString(),
                responsePreview = content.Length > 500 ? content[..500] + "..." : content,
                targetUrl = CloudRunUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "调用 Cloud Run 失败");
            return Ok(new
            {
                success = false,
                message = $"调用失败: {ex.Message}",
                targetUrl = CloudRunUrl
            });
        }
    }
}
