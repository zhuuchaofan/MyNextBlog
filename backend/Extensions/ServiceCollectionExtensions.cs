using Ganss.Xss;
using MyNextBlog.Middlewares;
using MyNextBlog.Services;
using MyNextBlog.Services.Email;

namespace MyNextBlog.Extensions;

/// <summary>
/// 业务服务注册扩展方法
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// 注册所有应用程序业务服务到 DI 容器
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // --- 基础设施服务 ---
        services.AddTransient<GlobalExceptionMiddleware>();
        services.AddMemoryCache();
        services.AddSingleton<IHtmlSanitizer, HtmlSanitizer>();
        
        // --- 业务服务 (Scoped 生命周期) ---
        // Scoped: 每个 HTTP 请求创建一个实例，请求结束后销毁
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<IStorageService, R2StorageService>();
        services.AddScoped<IImageService, ImageService>();
        services.AddScoped<IGalleryService, GalleryService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ITagService, TagService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ISeriesService, SeriesService>();
        
        // --- 单例服务 ---
        services.AddSingleton<IEmailService, SmtpEmailService>();
        
        // TODO: PostgreSQL 备份需使用 pg_dump，暂时禁用
        // services.AddHostedService<DatabaseBackupService>();

        return services;
    }
}
