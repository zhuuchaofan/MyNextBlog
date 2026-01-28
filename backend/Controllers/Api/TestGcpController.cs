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

    /// <summary>
    /// 发送消息到 Gradio Chat API
    /// </summary>
    [HttpPost("chat")]
    [AllowAnonymous]
    public async Task<IActionResult> GradioChat([FromBody] GradioChatRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { success = false, message = "消息内容不能为空" });
            }

            // 1. 获取 OIDC Token
            var credential = await GoogleCredential.GetApplicationDefaultAsync();
            var oidcToken = await credential.GetOidcTokenAsync(OidcTokenOptions.FromTargetAudience(CloudRunUrl));
            var tokenString = await oidcToken.GetAccessTokenAsync();

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenString);

            _logger.LogInformation("发送 Gradio 请求: {Message}", request.Message);

            // 2. Step 1: POST 获取 EVENT_ID
            var gradioPayload = new
            {
                data = new object[]
                {
                    new { text = request.Message, files = Array.Empty<string>() }
                }
            };

            var jsonContent = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(gradioPayload),
                System.Text.Encoding.UTF8,
                "application/json");

            var postUrl = $"{CloudRunUrl}/gradio_api/call/chat";
            var postResponse = await client.PostAsync(postUrl, jsonContent);
            var postBody = await postResponse.Content.ReadAsStringAsync();

            if (!postResponse.IsSuccessStatusCode)
            {
                return Ok(new
                {
                    success = false,
                    step = "POST",
                    statusCode = (int)postResponse.StatusCode,
                    error = postBody
                });
            }

            // 解析 EVENT_ID
            using var jsonDoc = System.Text.Json.JsonDocument.Parse(postBody);
            var eventId = jsonDoc.RootElement.GetProperty("event_id").GetString();

            _logger.LogInformation("获取到 EVENT_ID: {EventId}", eventId);

            // 3. Step 2: GET 获取结果 (SSE)
            var getUrl = $"{CloudRunUrl}/gradio_api/call/chat/{eventId}";
            var getResponse = await client.GetAsync(getUrl);
            var getBody = await getResponse.Content.ReadAsStringAsync();

            _logger.LogInformation("Gradio 响应: {StatusCode}", getResponse.StatusCode);

            return Ok(new
            {
                success = getResponse.IsSuccessStatusCode,
                eventId,
                statusCode = (int)getResponse.StatusCode,
                response = getBody
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Gradio Chat 调用失败");
            return Ok(new
            {
                success = false,
                message = $"请求失败: {ex.Message}"
            });
        }
    }
}

/// <summary>
/// Gradio Chat 请求
/// </summary>
public record GradioChatRequest(string Message);

/// <summary>
/// 文章摘要请求 (已弃用，保留兼容)
/// </summary>
public record SummarizeRequest(string Content);
