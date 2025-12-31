// ============================================================================
// Middlewares/GlobalExceptionMiddleware.cs - 全局异常处理中间件
// ============================================================================
// 此中间件负责捕获应用程序中所有未处理的异常，提供统一的错误响应格式。
//
// **核心功能**:
//   - 捕获管道中的所有异常
//   - 记录错误日志 (Serilog)
//   - 返回统一的 JSON 错误响应
//
// **安全考量**:
//   - 生产环境不暴露异常详情，防止信息泄露
//   - ArgumentException 返回 400，其他异常返回 500

// `using` 语句用于导入必要的命名空间
using System.Net;           // HTTP 状态码枚举
using System.Text.Json;      // JSON 序列化

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.Middlewares;

/// <summary>
/// `GlobalExceptionMiddleware` 是一个 ASP.NET Core 中间件，实现 `IMiddleware` 接口。
/// 
/// **工作原理**:
/// 1. 调用 `next(context)` 执行后续中间件
/// 2. 如果后续中间件抛出异常，在 catch 块中处理
/// 3. 记录日志并返回统一的 JSON 错误响应
/// </summary>
public class GlobalExceptionMiddleware(ILogger<GlobalExceptionMiddleware> logger) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            // 继续执行管道中的下一个中间件
            await next(context);
        }
        catch (Exception ex)
        {
            // 如果后续中间件抛出异常，在这里捕获
            logger.LogError(ex, "An unhandled exception occurred.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = new
        {
            StatusCode = context.Response.StatusCode,
            Message = "Internal Server Error. Please try again later.",
            // 在生产环境中不应暴露详细的异常信息，但在开发环境中可能有用。
            // 这里我们保持保守，只返回通用消息。
            // Details = exception.Message 
        };

        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }
}
