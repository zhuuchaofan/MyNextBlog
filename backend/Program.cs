using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MyNextBlog.Data;
using MyNextBlog.Extensions; // 引入刚才创建的扩展方法命名空间
using MyNextBlog.Services;
using Serilog;
using System.Text;

// 创建 Web 应用构建器
// 这是整个程序的起点，负责加载配置、注册服务
var builder = WebApplication.CreateBuilder(args);

// ==================================================================
// 0. 日志系统初始化 (Serilog)
// ==================================================================
// 作用：接管系统的日志输出。相比默认的 Console.WriteLine，Serilog 能输出结构化日志（JSON格式），方便后续查询分析。
// 配置来源：appsettings.json 中的 "Serilog" 节点
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext() // 自动记录上下文信息（如 RequestId）
    .WriteTo.Console());     // 始终输出到控制台，这是 Docker 容器日志的最佳实践

// ==================================================================
// 第一阶段：服务注册 (Dependency Injection / DI 容器)
// 概念：这里是“人才市场”。我们把需要用到的工具（类）都注册到这里。
// 以后在 Controller 或其他地方需要用时，只需要在构造函数里声明，系统就会自动发给你（注入）。
// ==================================================================

// 注册基础控制器服务 (处理 API 请求)
builder.Services.AddControllers();

// 注册 Swagger (API 文档生成工具)
// 作用：扫描代码中的 Controller，自动生成可视化的 API 接口文档页面
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- 业务服务注册 (Scoped) ---
// Scoped (作用域): 每次 HTTP 请求会创建一个新的实例，请求结束时销毁。
// 适合数据库上下文、业务逻辑服务等需要保持请求内状态一致的对象。
builder.Services.AddScoped<IPostService, PostService>();       // 文章服务
builder.Services.AddScoped<IStorageService, R2StorageService>(); // 文件存储服务 (Cloudflare R2)
builder.Services.AddScoped<IImageService, ImageService>();     // 图片处理服务
builder.Services.AddScoped<ICategoryService, CategoryService>(); // 分类服务
builder.Services.AddScoped<ITagService, TagService>();         // 标签服务
builder.Services.AddScoped<IAuthService, AuthService>();       // 认证服务

// --- 后台任务注册 (HostedService) ---
// HostedService: 随应用程序启动而启动，直到程序关闭。
// 适合定时任务、后台处理队列等。
builder.Services.AddHostedService<DatabaseBackupService>();    // 数据库自动备份服务

// --- 跨域资源共享 (CORS) 配置 ---
// 作用：浏览器的安全机制默认禁止网页访问不同域名的 API。
// 这里我们需要显式允许前端项目 (Next.js) 访问我们的后端 API。
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJs", policy =>
    {
        // 从配置文件读取允许的域名列表
        // 这样修改域名时只需改 appsettings.json，不用重新编译代码
        var allowedOrigins = builder.Configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() 
                             ?? Array.Empty<string>();

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()   // 允许任何 HTTP 头
              .AllowAnyMethod()   // 允许 GET, POST, PUT, DELETE 等所有方法
              .AllowCredentials(); // 重要：允许携带 Cookie 或认证头
    });
});

// --- 数据库配置 ---
// 读取连接字符串并配置 SQLite 数据库
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- 身份认证 (Authentication) 配置 ---
// 作用：告诉系统如何识别“来访者”是谁。
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme; // 默认使用 JWT
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    // 读取 JWT 密钥配置
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    
    // 配置令牌验证参数
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,          // 验证颁发者 (是否是我们签发的)
        ValidateAudience = true,        // 验证受众 (是否是发给我们的)
        ValidateLifetime = true,        // 验证有效期 (是否过期)
        ValidateIssuerSigningKey = true,// 验证签名 (防止篡改)
        
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)), // "!" 表示确保不为空
        
        // 显式指定 Claim 类型映射，确保 User.Identity.Name 和 User.IsInRole() 能正常工作
        RoleClaimType = System.Security.Claims.ClaimTypes.Role,
        NameClaimType = System.Security.Claims.ClaimTypes.Name
    };
});

// ==================================================================
// 第二阶段：构建应用 (Build)
// 到这一步，所有的服务都已注册完毕，可以开始组装管道了。
// ==================================================================
var app = builder.Build();

// ==================================================================
// 第三阶段：中间件管道配置 (Middleware Pipeline)
// 概念：这是一个“洋葱模型”。请求从外层进入，一层层经过中间件处理，最后到达 Controller。
// 顺序非常重要！
// ==================================================================

// 1. 全局异常处理
if (!app.Environment.IsDevelopment())
{
    // 生产环境：使用 HSTS (HTTP Strict Transport Security) 强制客户端使用 HTTPS
    app.UseHsts(); 
}

// 2. API 文档 (Swagger)
// 即使在生产环境也开启，方便远程调试 API
app.UseSwagger();
app.UseSwaggerUI();

// 3. 基础网络处理
app.UseHttpsRedirection(); // HTTP -> HTTPS 跳转
app.UseStaticFiles();      // 允许访问 wwwroot 下的静态文件 (如上传的图片)

// 4. 日志记录
// 使用 Serilog 记录每个 HTTP 请求的摘要信息 (方法、路径、状态码、耗时)
app.UseSerilogRequestLogging();

// 5. 路由
// 确定请求 URL 对应哪个 Controller
app.UseRouting();

// 6. 跨域策略
// 必须在 UseRouting 之后，UseAuthentication 之前
app.UseCors("AllowNextJs");

// 7. 安全与权限 (这两步顺序不能颠倒)
app.UseAuthentication(); // 认证：你是谁？(检查 Token/Cookie)
app.UseAuthorization();  // 授权：你能干什么？(检查 Role)

// 8. 终点映射
// 将请求分发到具体的 Controller 方法
app.MapControllers();

// ==================================================================
// 第四阶段：数据初始化 (Data Seeding)
// 使用我们封装的扩展方法，在启动时自动检查数据库和写入初始数据
// ==================================================================
app.SeedDatabase();

// ==================================================================
// 第五阶段：启动监听 (Run)
// ==================================================================
app.Run();