// ============================================================================
// Extensions/ServiceCollectionExtensions.cs - 服务注册扩展方法
// ============================================================================
// 此文件集中管理所有业务服务的依赖注入 (DI) 注册。
// 通过扩展方法组织，保持 Program.cs 简洁。
//
// **服务生命周期**:
//   - Transient: 每次注入创建新实例 (中间件)
//   - Scoped: 每个 HTTP 请求一个实例 (业务服务)
//   - Singleton: 应用程序生命周期内单例 (Email、Cache)

// `using` 语句用于导入必要的命名空间
using Ganss.Xss;                     // XSS 防护库 (HtmlSanitizer)
using MyNextBlog.Middlewares;         // 自定义中间件
using MyNextBlog.Services;            // 业务服务接口和实现
using MyNextBlog.Services.Email;      // 邮件服务
using MyNextBlog.Services.Payment;    // 支付网关服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Extensions;

/// <summary>
/// `ServiceCollectionExtensions` 提供 `IServiceCollection` 的扩展方法。
/// 
/// **设计目的**:
///   - 将服务注册逻辑从 `Program.cs` 中分离出来
///   - 按模块组织服务，便于维护
///   - 使用扩展方法支持链式调用
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
        services.AddScoped<IAnniversaryService, AnniversaryService>();
        services.AddScoped<IAnniversaryReminderService, AnniversaryReminderService>();
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<IPlanService, PlanService>(); // 计划服务
        services.AddScoped<IPlanReminderService, PlanReminderService>(); // 计划提醒服务
        services.AddScoped<IStatsService, StatsService>(); // 统计服务
        services.AddScoped<ISiteContentService, SiteContentService>(); // 站点内容服务
        services.AddScoped<ICommentNotificationService, CommentNotificationService>(); // 评论通知服务
        
        // --- 购物功能服务 ---
        services.AddScoped<IProductService, ProductService>(); // 商品服务
        services.AddScoped<IOrderService, OrderService>(); // 订单服务
        services.AddScoped<IOrderNotificationService, OrderNotificationService>(); // 订单通知服务
        services.AddScoped<IPaymentGateway, MockPaymentGateway>(); // 支付网关（模拟）
        
        // --- 单例服务 ---
        services.AddSingleton<IEmailService, SmtpEmailService>();
        
        // --- 后台服务 ---
        // PostgreSQL 备份服务 (每天 03:00 UTC 自动备份到 R2)
        services.AddHostedService<DatabaseBackupService>();
        services.AddHostedService<AnniversaryReminderHostedService>();
        
        // --- 友链功能服务 ---
        services.AddScoped<IFriendLinkService, FriendLinkService>();
        services.AddHostedService<FriendHealthCheckHostedService>();
        services.AddHttpClient("HealthCheck");  // 健康检查专用 HttpClient
        
        // --- Memo 动态服务 ---
        services.AddScoped<IMemoService, MemoService>();

        // --- 用户状态服务 (Digital Presence) ---
        services.AddSingleton<IPresenceService, PresenceService>();  // Singleton: 共享缓存状态
        services.AddHostedService<PresenceBackgroundService>();      // 后台轮询服务
        services.AddHttpClient("Presence");                          // Steam/WakaTime API 专用 HttpClient

        return services;
    }
}
