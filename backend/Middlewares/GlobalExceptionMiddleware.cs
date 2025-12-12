using System.Net;
using System.Text.Json;

namespace MyNextBlog.Middlewares;

/// <summary>
/// 全局异常处理中间件
/// 捕获应用程序中的所有未处理异常，记录日志，并返回统一的 JSON 错误响应。
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
