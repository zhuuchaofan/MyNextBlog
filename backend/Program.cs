// ============================================================================
// Program.cs - ASP.NET Core 应用程序入口点
// ============================================================================
// 此文件是应用程序的启动配置文件，使用 .NET 6+ 的 Minimal API 风格。
// 主要职责：配置服务容器 (DI)、中间件管道、数据库连接和应用启动。

// `using` 语句用于导入必要的命名空间
using System.Text.Json;                    // 引入 JSON 序列化基础类型
using System.Text.Json.Serialization;      // 引入 JSON 序列化特性 (ReferenceHandler)
using System.Threading.RateLimiting;       // 引入 Rate Limiting 相关类型
using Microsoft.EntityFrameworkCore;       // 引入 Entity Framework Core
using MyNextBlog.Data;                     // 引入数据访问层 (AppDbContext)
using MyNextBlog.Extensions;               // 引入扩展方法 (服务注册、中间件)
using Serilog;                             // 引入 Serilog 结构化日志库
using Microsoft.AspNetCore.DataProtection; // 引入数据保护 API (Cookie 加密)

// ==================================================================
// PostgreSQL 兼容性设置 (必须在 CreateBuilder 之前)
// ==================================================================
// 修复 Npgsql 6.0+ 对 `DateTime` 类型的默认 UTC 处理行为
// 设置后，`DateTime` 会保持本地时间而非强制转换为 UTC
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ==================================================================
// 日志系统 (Serilog)
// ==================================================================
// 使用 Serilog 替代默认的 ILogger，支持结构化日志和多目标输出
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)  // 从 appsettings.json 读取配置
    .ReadFrom.Services(services)                    // 允许从 DI 容器获取服务
    .Enrich.FromLogContext()                        // 添加上下文信息 (CorrelationId 等)
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{CorrelationId}] {Message:lj}{NewLine}{Exception}"));

// ==================================================================
// 服务注册 (Dependency Injection)
// ==================================================================

// 1. **配置 Controllers 和 JSON 序列化**
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // `ReferenceHandler.IgnoreCycles`: 忽略循环引用
        // 修复评论树 (A.Children -> B -> B.Children -> A) 序列化时的 JsonException
        // 当检测到循环时，将循环引用设为 null 而非抛出异常
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        
        // `WhenWritingNull`: 不输出 null 值的属性
        // 减少 JSON 响应体积，前端使用可选链 (?.) 处理
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        
        // **UTC DateTime 转换器**: 确保所有 DateTime 序列化时带 Z 后缀
        // 修复前端 JavaScript new Date() 误解析为本地时间的问题
        options.JsonSerializerOptions.Converters.Add(new MyNextBlog.Converters.UtcDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new MyNextBlog.Converters.NullableUtcDateTimeConverter());
    });

// 2. **Swagger/OpenAPI 文档**
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. **应用程序业务服务**
// 具体服务注册拆分到 Extensions/ServiceCollectionExtensions.cs
// 包括: IPostService, ICommentService, IImageService 等
builder.Services.AddApplicationServices();

// 4. **健康检查端点**
// 用于 Docker/Kubernetes 的存活探针 (Liveness Probe)
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();  // 检查数据库连接

// 5. **CORS 跨域配置**
// 具体配置拆分到 Extensions/CorsExtensions.cs
builder.Services.AddCorsPolicy(builder.Configuration);

// 6. **数据库连接 (PostgreSQL)**
// 全局配置 SplitQuery：防止多集合 Include 时的笛卡尔积问题
// 参考: https://go.microsoft.com/fwlink/?linkid=2134277
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)
    ));

// 7. **JWT 认证配置**
// 具体配置拆分到 Extensions/AuthenticationExtensions.cs
builder.Services.AddJwtAuthentication(builder.Configuration);

// 8. **Rate Limiting (频率限制)**
// 防止暴力破解登录和 API 滥用
builder.Services.AddRateLimiter(options =>
{
    // 登录接口专用策略: 每分钟最多 5 次尝试 (基于 IP)
    options.AddPolicy("login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0 // 不排队，直接拒绝
            }));
    
    // 点赞接口策略: 每分钟最多 10 次 (基于 IP)
    // 防止刷赞行为，同时保证正常用户体验
    options.AddPolicy("like", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
    
    // 全局策略: 每分钟最多 100 次请求 (针对同一 IP)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            });
    });
    
    // 拒绝时返回 429 Too Many Requests
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ==================================================================
// Data Protection (数据保护)
// ==================================================================
// 防止 Docker 容器重启后 Cookie/AntiForgery Token 失效
// 密钥持久化到文件系统，确保容器重启后密钥不变
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(
        Path.Combine(builder.Environment.ContentRootPath, "data", "keys")))
    .SetApplicationName("MyNextBlog");

// ==================================================================
// 构建应用实例
// ==================================================================
var app = builder.Build();

// ==================================================================
// 中间件管道 (Middleware Pipeline)
// ==================================================================
// 具体中间件配置拆分到 Extensions/MiddlewarePipelineExtensions.cs
// 包括: 异常处理、静态文件、路由、认证授权等
app.UseApplicationPipeline();

// ==================================================================
// 自动数据库迁移 (Auto Migration)
// ==================================================================
// 应用启动时自动执行 EF Core 迁移
// 适用于开发和 Docker 部署场景，生产环境建议手动迁移
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();  // 应用所有待处理的迁移
        Log.Information("✅ Database migrated successfully.");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "❌ Database migration failed.");
        // 注意：迁移失败不会阻止应用启动，但数据库操作会失败
    }
}

// ==================================================================
// 数据初始化与启动
// ==================================================================
app.SeedDatabase();           // 播种默认数据 (分类、管理员账户等)
app.MapHealthChecks("/health"); // 映射健康检查端点
app.Run();                     // 启动应用，开始监听请求