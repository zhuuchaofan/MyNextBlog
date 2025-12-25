using Microsoft.AspNetCore.HttpOverrides;
using MyNextBlog.Middlewares;
using Serilog;

namespace MyNextBlog.Extensions;

/// <summary>
/// 中间件管道配置扩展方法
/// </summary>
public static class MiddlewarePipelineExtensions
{
    /// <summary>
    /// 配置 HTTP 中间件管道（顺序很重要！）
    /// </summary>
    public static WebApplication UseApplicationPipeline(this WebApplication app)
    {
        // 1. 全局异常处理 (必须在最前面)
        app.UseMiddleware<GlobalExceptionMiddleware>();
        
        // 2. 反向代理头处理 (Docker/Nginx 环境获取真实 IP)
        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
        });
        
        // 3. 生产环境安全头
        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }
        
        // 4. API 文档
        app.UseSwagger();
        app.UseSwaggerUI();
        
        // 5. HTTPS 重定向 & 静态文件
        app.UseHttpsRedirection();
        app.UseStaticFiles();
        
        // 6. 请求日志
        app.UseSerilogRequestLogging();
        
        // 7. 路由
        app.UseRouting();
        
        // 8. CORS (必须在 Routing 后、Authentication 前)
        app.UseCors(CorsExtensions.PolicyName);
        
        // 9. 认证 & 授权 (顺序不能颠倒！)
        app.UseAuthentication();
        app.UseAuthorization();
        
        // 10. 端点映射
        app.MapControllers();
        
        return app;
    }
}
