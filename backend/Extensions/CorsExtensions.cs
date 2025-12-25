namespace MyNextBlog.Extensions;

/// <summary>
/// CORS 跨域配置扩展方法
/// </summary>
public static class CorsExtensions
{
    public const string PolicyName = "AllowNextJs";
    
    /// <summary>
    /// 配置 CORS 策略，允许前端跨域访问
    /// </summary>
    public static IServiceCollection AddCorsPolicy(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                var allowedOrigins = configuration
                    .GetSection("CorsSettings:AllowedOrigins")
                    .Get<string[]>() ?? Array.Empty<string>();

                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });

        return services;
    }
}
