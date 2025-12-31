// ============================================================================
// CorrelationIdMiddleware.cs - 请求关联 ID 中间件
// ============================================================================
// 此中间件用于为每个 HTTP 请求分配或读取唯一的 Correlation ID，
// 实现完整的请求链路追踪 (Distributed Tracing)。
//
// **核心功能**：
// 1. 从请求头读取 `X-Correlation-ID`，如果客户端未传递则自动生成
// 2. 将 ID 推入 Serilog LogContext，使所有日志都包含该 ID
// 3. 在响应头中返回 ID，方便客户端和开发者调试
//
// **使用场景**：
// 前端请求 → Next.js Middleware → 后端 API → 日志
// 通过 CorrelationId 可以串起完整链路，快速定位问题

using Serilog.Context;

namespace MyNextBlog.Middlewares;

/// <summary>
/// 请求关联 ID 中间件
/// </summary>
public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    
    /// <summary>
    /// HTTP Header 名称，业界标准命名
    /// </summary>
    public const string CorrelationIdHeader = "X-Correlation-ID";

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. 尝试从请求头读取 CorrelationId
        var correlationId = context.Request.Headers[CorrelationIdHeader].FirstOrDefault();
        
        // 2. 如果未传递，则生成新的 GUID
        if (string.IsNullOrWhiteSpace(correlationId))
        {
            correlationId = Guid.NewGuid().ToString("N")[..8]; // 取前8位，更简洁
        }
        
        // 3. 存储到 HttpContext.Items，供后续中间件/控制器使用
        context.Items["CorrelationId"] = correlationId;
        
        // 4. 添加到响应头，方便客户端调试
        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationIdHeader] = correlationId;
            return Task.CompletedTask;
        });
        
        // 5. 推入 Serilog LogContext，所有后续日志都会包含此属性
        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}
