using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Extensions;
using Serilog;
using Microsoft.AspNetCore.DataProtection;

// ==================================================================
// PostgreSQL 兼容性设置 (必须在 CreateBuilder 之前)
// ==================================================================
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// ==================================================================
// 日志系统 (Serilog)
// ==================================================================
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// ==================================================================
// 服务注册 (Dependency Injection)
// ==================================================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 应用程序业务服务 (拆分到 Extensions/ServiceCollectionExtensions.cs)
builder.Services.AddApplicationServices();

// 健康检查
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();

// CORS 跨域 (拆分到 Extensions/CorsExtensions.cs)
builder.Services.AddCorsPolicy(builder.Configuration);

// 数据库 (PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT 认证 (拆分到 Extensions/AuthenticationExtensions.cs)
builder.Services.AddJwtAuthentication(builder.Configuration);

// ==================================================================
// Data Protection (防止 Docker 重启导致 Cookie/Tokens 失效)
// ==================================================================
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(builder.Environment.ContentRootPath, "data", "keys")))
    .SetApplicationName("MyNextBlog");

// ==================================================================
// 构建应用
// ==================================================================
var app = builder.Build();

// ==================================================================
// 中间件管道 (拆分到 Extensions/MiddlewarePipelineExtensions.cs)
// ==================================================================
app.UseApplicationPipeline();

// ==================================================================
// 数据初始化 & 启动
// ==================================================================
app.SeedDatabase();
app.MapHealthChecks("/health");
app.Run();