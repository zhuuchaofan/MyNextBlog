// ============================================================================
// Middlewares/RequestTimingMiddleware.cs - 请求计时中间件
// ============================================================================
// 此中间件用于记录 API 请求的响应时间，帮助识别性能瓶颈。
//
// **功能**:
//   - 记录每个请求的耗时
//   - 超过阈值 (500ms) 的请求记录 Warning 日志
//   - 排除健康检查等噪音端点
//
// **日志格式**: [响应时间] {Method} {Path} - {ElapsedMs}ms

using System.Diagnostics;

namespace MyNextBlog.Middlewares;

/// <summary>
/// 请求计时中间件
/// 
/// 记录 API 请求耗时，超过阈值时输出 Warning 日志。
/// </summary>
public class RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
{
    /// <summary>
    /// 慢请求阈值 (毫秒)
    /// 超过此值的请求会被记录为 Warning
    /// </summary>
    private const int SlowRequestThresholdMs = 500;
    
    /// <summary>
    /// 需要排除的路径前缀
    /// 这些路径不参与计时统计（如健康检查、Swagger）
    /// </summary>
    private static readonly string[] ExcludedPaths = ["/health", "/swagger"];

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. 检查是否需要排除此路径
        var path = context.Request.Path.Value ?? "";
        if (ExcludedPaths.Any(excluded => path.StartsWith(excluded, StringComparison.OrdinalIgnoreCase)))
        {
            await next(context);
            return;
        }

        // 2. 开始计时
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            await next(context);
        }
        finally
        {
            // 3. 停止计时并记录
            stopwatch.Stop();
            var elapsedMs = stopwatch.ElapsedMilliseconds;
            var method = context.Request.Method;
            var statusCode = context.Response.StatusCode;

            // 4. 根据耗时选择日志级别
            if (elapsedMs >= SlowRequestThresholdMs)
            {
                // 慢请求 - Warning 级别
                logger.LogWarning(
                    "⚠️ 慢请求: {Method} {Path} - {ElapsedMs}ms (Status: {StatusCode})",
                    method, path, elapsedMs, statusCode);
            }
            else
            {
                // 正常请求 - Debug 级别 (生产环境通常不输出)
                logger.LogDebug(
                    "⏱️ {Method} {Path} - {ElapsedMs}ms (Status: {StatusCode})",
                    method, path, elapsedMs, statusCode);
            }
        }
    }
}
