// using 语句用于导入命名空间。命名空间可以理解为一个“工具箱”或“代码库”，
// 里面包含了我们将在本文件中使用的类、接口和其他类型。
// 这样我们就可以直接使用这些类型，而不需要写它们的完整路径。

using Microsoft.AspNetCore.Authentication.JwtBearer; // 用于 JWT 身份认证
using Microsoft.EntityFrameworkCore;                // 用于 Entity Framework Core (数据库操作)
using Microsoft.IdentityModel.Tokens;               // 用于处理安全令牌，特别是 JWT
using MyNextBlog.Data;                              // 导入数据访问层命名空间，包含 AppDbContext
using MyNextBlog.Extensions;                         // 导入我们自己定义的扩展方法，比如 SeedDatabase
using MyNextBlog.Services;                           // 导入业务逻辑服务层命名空间
using MyNextBlog.Services.Email;                           // 导入邮件服务命名空间
using MyNextBlog.Middlewares;                        // 导入中间件命名空间
using Serilog;                                      // 导入 Serilog 日志库
using System.Text;                                  // 用于字符串编码等操作
using Ganss.Xss;                                    // 引入 XSS 清洗库

// ==================================================================
// 程序的入口点：创建 WebApplicationBuilder
// ==================================================================
// PostgreSQL 时间戳兼容性开关 (必须在 CreateBuilder 之前设置)
// Npgsql 6.0+ 对 DateTimeKind.Unspecified 非常严格，会抛出异常。
// 此开关启用旧版行为，允许使用 DateTime.Now (Kind=Local/Unspecified)。
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// 这一行代码是 ASP.NET Core 程序的起点，它创建了一个 `WebApplicationBuilder` 实例。
// `builder` 对象负责：
// 1. 读取应用程序的配置（例如 appsettings.json, 环境变量等）。
// 2. 注册各种服务到依赖注入（DI）容器中。
// 3. 构建 HTTP 请求处理管道。
// `args` 参数允许从命令行传递配置。
var builder = WebApplication.CreateBuilder(args);

// ==================================================================
// 0. 日志系统初始化 (Serilog)
// ==================================================================
// Serilog 是一个功能强大的第三方日志库。
// 作用：它接管了应用程序的日志输出。与 C# 内置的 `Console.WriteLine` 或 `ILogger` 相比，
// Serilog 能够输出“结构化日志”（例如 JSON 格式）。这意味着日志不仅仅是文本，而是包含
// 键值对的数据，非常便于后续的日志收集、搜索和分析（例如导入到 ELK Stack 或 Grafana Loki）。
//
// `builder.Host.UseSerilog(...)` 这行代码就是配置 Serilog 作为我们应用程序的日志提供者。
builder.Host.UseSerilog((context, services, configuration) => configuration
    // `.ReadFrom.Configuration(context.Configuration)`: 告诉 Serilog 从应用程序的配置源
    // （例如 `appsettings.json` 文件）中读取名为 "Serilog" 的配置节。
    // 这样，我们就可以在配置文件中灵活地设置日志级别、输出目标（如文件、数据库、云服务）等，
    // 而无需修改代码。
    .ReadFrom.Configuration(context.Configuration)
    // `.ReadFrom.Services(services)`: 允许 Serilog 从 DI 容器中获取其他服务。
    // 例如，如果你想在日志中包含某个服务提供的信息，就可以使用此功能。
    .ReadFrom.Services(services)
    // `.Enrich.FromLogContext()`: 这是一个“增强器”。它会自动向每条日志记录中添加额外的上下文信息，
    // 例如当前 HTTP 请求的 ID、用户名、客户端 IP 地址等。这对于跟踪请求在整个系统中的生命周期
    // 和排查问题非常有帮助。
    .Enrich.FromLogContext()
    // `.WriteTo.Console()`: 指定日志的输出目标。这里是把所有日志都输出到控制台。
    // 在 Docker 容器环境中，将日志输出到标准输出 (stdout/stderr) 是最佳实践，因为容器编排工具
    // (如 Docker Compose, Kubernetes) 会自动收集这些输出。
    .WriteTo.Console());

// ==================================================================
// 第一阶段：服务注册 (Dependency Injection / DI 容器)
// ==================================================================
// 概念：依赖注入（Dependency Injection，简称 DI）是 ASP.NET Core 的核心特性之一。
// 可以把它想象成一个“人才市场”或“工具箱管理中心”。
//
// 作用：
// 1. **解耦**: 你的类（比如 Controller）不需要自己去创建它依赖的其他类（比如 Service），
//    而是声明自己需要什么（通过构造函数参数），DI 容器会自动“送货上门”（创建并提供实例）。
//    这使得代码模块化，互相独立，更容易测试和维护。
// 2. **复用**: 很多服务（如数据库上下文、日志器）只需要创建一次或按需创建，DI 容器会管理它们的生命周期。
// 3. **统一管理**: 所有的服务都在这里进行配置和注册，方便统一管理。
//
// `builder.Services` 就是用来注册各种服务的集合。

// 注册全局异常处理中间件
builder.Services.AddTransient<GlobalExceptionMiddleware>();

// 注册内存缓存服务 (Memory Cache)
// 这允许我们在应用程序内存中存储数据，以减少数据库查询，提高性能。
builder.Services.AddMemoryCache();

// `builder.Services.AddControllers();`
// 作用：注册应用程序中所有的 Controller 类。这是构建 Web API 应用程序的基石。
// 它会告诉 ASP.NET Core 框架去扫描程序集中的所有 Controller，并使它们能够响应 HTTP 请求。
builder.Services.AddControllers();

// 注册 XSS 清洗服务 (单例)
builder.Services.AddSingleton<IHtmlSanitizer, HtmlSanitizer>();

// ------------------------------------------------------------------
// Swagger/OpenAPI 相关服务注册
// ------------------------------------------------------------------
// Swagger (现在通常称为 OpenAPI Specification) 是一个用于描述 RESTful API 的标准。
// 它可以生成交互式的 API 文档，方便前端开发人员和 API 消费者理解和测试接口。
//
// `builder.Services.AddEndpointsApiExplorer();`
// 作用：启用 API 探索功能。它允许 Swagger 工具发现应用程序中的所有 API 端点，
// 并收集它们的元数据（例如路由、HTTP 方法、参数、响应类型等）。
builder.Services.AddEndpointsApiExplorer();
// `builder.Services.AddSwaggerGen();`
// 作用：注册 Swagger 文档生成器。它使用上面收集到的 API 元数据来生成符合 OpenAPI 规范的 JSON 文件。
// 之后，我们可以通过 `app.UseSwagger()` 和 `app.UseSwaggerUI()` 中间件来暴露这个 JSON 文件，
// 并提供一个漂亮的 Web UI 界面来展示和测试 API。
builder.Services.AddSwaggerGen();

// --- 业务服务注册 (Scoped 生命周期) ---
// ------------------------------------------------------------------
// `AddScoped<TInterface, TImplementation>()` 方法用于注册服务到 DI 容器。
// `TInterface` 是服务的接口（例如 `IPostService`），`TImplementation` 是接口的具体实现类（例如 `PostService`）。
//
// `Scoped` 生命周期意味着：
// 1. **在每个客户端请求（HTTP Request）开始时，DI 容器会为这个请求创建一个服务的新实例。**
// 2. **在这个请求的整个生命周期内，每次需要这个服务时，都会重用同一个实例。**
// 3. **当请求结束时，这个服务实例会被销毁。**
//
// 为什么选择 Scoped？
// 像数据库上下文（`AppDbContext`）和业务逻辑服务通常需要保持在单个请求内状态的一致性。
// 例如，在一个请求中，对 `PostService` 的所有操作都应该使用同一个 `AppDbContext` 实例。
// Scoped 生命周期完美满足了这种需求。
builder.Services.AddScoped<IPostService, PostService>();       // 文章服务接口及其实现
builder.Services.AddScoped<ICommentService, CommentService>();   // 评论服务接口及其实现
builder.Services.AddScoped<IStorageService, R2StorageService>(); // 文件存储服务，例如上传文件到 Cloudflare R2
builder.Services.AddScoped<IImageService, ImageService>();     // 图片处理服务，负责图片关联和清理
builder.Services.AddScoped<IGalleryService, GalleryService>();   // 画廊服务
builder.Services.AddScoped<ICategoryService, CategoryService>(); // 分类管理服务
builder.Services.AddScoped<ITagService, TagService>();         // 标签管理服务
builder.Services.AddScoped<IAuthService, AuthService>();       // 用户认证和授权服务
builder.Services.AddScoped<IUserService, UserService>();       // 用户管理服务
builder.Services.AddSingleton<IEmailService, SmtpEmailService>(); // 真实邮件服务

// --- 后台任务注册 (HostedService 生命周期) ---
// ------------------------------------------------------------------
// `HostedService` 是一种特殊的服务，它不响应 HTTP 请求，而是在应用程序启动时启动，
// 并在应用程序整个运行期间在后台执行任务，直到应用程序关闭。
//
// `AddHostedService<TImplementation>()` 方法用于注册一个后台服务。
// `TImplementation` 必须实现 `IHostedService` 接口（通常是继承 `BackgroundService` 抽象类）。
//
// 为什么使用 HostedService？
// 适合执行那些需要长时间运行、定时执行或独立于请求的后台任务，例如：
//   - 定时数据同步
//   - 消息队列处理
//   - 数据库健康检查
//   - 这里的数据库自动备份
builder.Services.AddScoped<ISeriesService, SeriesService>();       // 系列管理服务
builder.Services.AddHostedService<DatabaseBackupService>();    // 数据库自动备份服务，定期将 SQLite 数据库备份到云存储。

// --- 健康检查 (Health Checks) ---
// ------------------------------------------------------------------
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>(); // 检查数据库连接是否正常

// --- 跨域资源共享 (CORS) 配置 ---
// ------------------------------------------------------------------
// CORS (Cross-Origin Resource Sharing)，中文是“跨域资源共享”。
// 这是一个由浏览器实施的安全机制。默认情况下，浏览器会阻止一个网页（例如，运行在 `http://localhost:3000` 的前端）
// 去请求另一个不同“源”（协议、域名、端口中任意一个不同）的 API（例如，运行在 `http://localhost:8080` 的后端）。
// 这种安全策略被称为“同源策略”。
//
// 作用：当我们的前端项目（Next.js）和后端 API 运行在不同的地址时，我们就需要显式地配置 CORS，
// 告诉浏览器“这是我允许的跨域请求，请不要阻止它”。
builder.Services.AddCors(options =>
{
    // `options.AddPolicy("AllowNextJs", ...)`: 定义一个名为 "AllowNextJs" 的 CORS 策略。
    // 我们可以在 `app.UseCors("AllowNextJs")` 中间件中使用这个策略。
    options.AddPolicy("AllowNextJs", policy =>
    {
        // 从配置文件 `appsettings.json` 中读取允许的前端域名列表。
        // `builder.Configuration.GetSection("CorsSettings:AllowedOrigins")` 会获取到配置中
        // `CorsSettings` 对象下的 `AllowedOrigins` 数组。
        // `Get<string[]>()` 尝试将配置转换为字符串数组。
        // `?? Array.Empty<string>()` 是一个空合并运算符：如果配置项不存在或为空，则使用一个空的字符串数组，
        // 避免空引用异常。
        // 这种做法使得允许的域名可以动态配置，无需重新编译代码。
        var allowedOrigins = builder.Configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() 
                             ?? Array.Empty<string>();

        // `policy.WithOrigins(allowedOrigins)`: 允许来自 `allowedOrigins` 列表中指定源的请求。
        // 例如，如果前端运行在 `http://localhost:3000`，这里就应该包含这个地址。
        policy.WithOrigins(allowedOrigins)
              // `AllowAnyHeader()`: 允许客户端发送任何 HTTP 请求头（例如 `Authorization` 头、`Content-Type` 头）。
              .AllowAnyHeader()   
              // `AllowAnyMethod()`: 允许客户端使用任何 HTTP 方法进行请求（例如 GET, POST, PUT, DELETE 等）。
              .AllowAnyMethod()   
              // `AllowCredentials()`: 这是非常重要的一点，它允许客户端在跨域请求中携带凭证（例如 Cookie、HTTP 认证）。
              // 当前端需要发送带有认证信息的请求（比如登录后的请求会携带 JWT Token 或 Session Cookie）时，
              // 必须设置此项，并且客户端的 `fetch` 或 `axios` 等请求库也需要配置 `withCredentials: true`。
              .AllowCredentials();
    });
});

// --- 数据库配置 (Entity Framework Core) ---
// ------------------------------------------------------------------
// Entity Framework Core (EF Core) 是一个对象关系映射 (ORM) 框架，
// 它允许我们使用 C# 对象来操作数据库，而无需编写大量的 SQL 语句。
//
// `builder.Services.AddDbContext<AppDbContext>(...)`: 将 `AppDbContext` 注册到 DI 容器。
// `AppDbContext` 是我们自定义的数据库上下文类，继承自 EF Core 的 `DbContext`。
// 它代表了数据库会话，包含了数据库中的所有实体集（`DbSet`，可以理解为数据库中的表）。
builder.Services.AddDbContext<AppDbContext>(options =>
    // 使用 PostgreSQL 数据库 (通过 Npgsql 提供者)
    // 连接字符串格式: "Host=<server>;Database=<db>;Username=<user>;Password=<pass>"
    // options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    // `options.UseSqlite(...)`: 指定使用 SQLite 数据库。EF Core 支持多种数据库，
    // 例如 SQL Server, PostgreSQL, MySQL 等，只需更换相应的 `Use...` 方法即可。
    // `builder.Configuration.GetConnectionString("DefaultConnection")`: 从配置文件
    // （例如 `appsettings.json`）中读取名为 "DefaultConnection" 的数据库连接字符串。
    // 连接字符串包含了数据库的路径、认证信息等。
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- 身份认证 (Authentication) 配置 ---
// ------------------------------------------------------------------
// 身份认证是“你是谁？”的问题。它验证用户提供的凭证（如用户名/密码、Token）是否有效，
// 并确定当前请求是来自哪个用户。
//
// `builder.Services.AddAuthentication(...)`: 注册身份认证服务，并配置默认的认证方案。
builder.Services.AddAuthentication(options =>
{
    // `options.DefaultScheme`: 指定默认的认证方案。这里我们使用 `JwtBearerDefaults.AuthenticationScheme`，
    // 表明我们将主要使用 JWT Bearer Token 进行认证。
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    // `options.DefaultChallengeScheme`: 当认证失败或需要认证时，使用的挑战方案。
    // 例如，如果一个受保护的 API 被未经认证的用户访问，系统会使用这个方案来回应。
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
// `.AddJwtBearer(...)`: 添加 JWT Bearer Token 认证方案的配置。
// 这是告诉 ASP.NET Core 如何验证传入的 JWT Token。
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    // 从配置文件中读取 JWT 相关的配置信息，例如颁发者、受众和密钥。
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    
    // 配置令牌验证参数 (`TokenValidationParameters`)
    // 这些参数定义了 JWT Token 必须满足哪些条件才被认为是有效的。
    options.TokenValidationParameters = new TokenValidationParameters
    {
        // `ValidateIssuer = true`: 验证 Token 的颁发者 (`iss` claim)。
        // 确保 Token 是由我们信任的服务器签发的。
        ValidateIssuer = true,          
        // `ValidateAudience = true`: 验证 Token 的受众 (`aud` claim)。
        // 确保 Token 是颁发给这个应用程序（或服务）使用的。
        ValidateAudience = true,        
        // `ValidateLifetime = true`: 验证 Token 的有效期 (`exp` claim) 和签发时间 (`iat` claim)。
        // 确保 Token 既没有过期，也没有在签发时间之前被使用。
        ValidateLifetime = true,        
        // `ValidateIssuerSigningKey = true`: 验证 Token 的签名。
        // 这是最关键的安全措施之一，它确保 Token 在传输过程中没有被篡改。
        ValidateIssuerSigningKey = true,

        // 实际的验证值，从配置文件中获取。
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        // `IssuerSigningKey`: 用于验证 Token 签名的密钥。
        // `SymmetricSecurityKey`: 表示一个对称加密密钥，颁发和验证使用同一个密钥。
        // `Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)`: 从配置文件获取密钥字符串，并转换为字节数组。
        // `!` 是 C# 8.0 引入的 null-forgiving 运算符，表示开发者确信 `SecretKey` 不会是 `null`。
        // **这个密钥（`SecretKey`）必须严格保密，绝对不能泄露！一旦泄露，任何人都可以伪造有效的 Token。**
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)), 
        
        // 显式指定 Claim 类型映射。
        // JWT Token 中的标准 Claim 类型名称（如 `role`, `nameid`）可能与 .NET Core
        // `ClaimsPrincipal` 中的 `ClaimTypes` 常量（如 `ClaimTypes.Role`, `ClaimTypes.NameIdentifier`）
        // 不完全一致。这些映射确保在 Controller 中通过 `User.Identity.Name` 或 `User.IsInRole()`
        // 方法获取用户信息时能够正常工作。
        RoleClaimType = System.Security.Claims.ClaimTypes.Role,        // 将 JWT 中的角色 Claim 映射到 .NET Core 的 ClaimTypes.Role
        NameClaimType = System.Security.Claims.ClaimTypes.Name         // 将 JWT 中的用户名 Claim 映射到 .NET Core 的 ClaimTypes.Name
    };
});

// ==================================================================
// 第二阶段：构建应用 (Build)
// ==================================================================
// `builder.Build()` 会使用之前在 `builder` 中配置的所有服务和设置来构建一个
// `WebApplication` 实例。这个 `app` 对象就是我们整个应用程序本身。
// 一旦 `app` 对象被构建，就不能再注册新的服务了。
var app = builder.Build();

// ==================================================================
// 第三阶段：中间件管道配置 (Middleware Pipeline)
// ==================================================================
// 概念：中间件（Middleware）是一系列按顺序执行的组件，它们构成了一个“处理管道”。
// 每个 HTTP 请求进入应用程序时，会像剥洋葱一样，一层一层地穿过这些中间件。
// 每个中间件都可以对请求进行处理、修改，或者决定是否将请求传递给下一个中间件。
//
// **顺序至关重要！** 中间件的注册顺序决定了它们在管道中执行的顺序。
// 例如，日志中间件应该在身份认证中间件之前，这样即使请求被认证拒绝，也能记录下来。

// 注册全局异常处理中间件 (必须放在管道最前面)
app.UseMiddleware<GlobalExceptionMiddleware>();

// 0. 反向代理头处理 (必须在 HSTS 之前)
// 关键修复: 使得应用在 Docker/Nginx 后能获取用户真实 IP
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

// 1. 全局异常处理和安全头
// `app.Environment.IsDevelopment()`: 检查当前应用程序是否在开发环境中运行。
// 这是根据 `ASPNETCORE_ENVIRONMENT` 环境变量判断的。
if (!app.Environment.IsDevelopment())
{
    // 生产环境：使用 HSTS (HTTP Strict Transport Security)
    // `app.UseHsts()`: 强制客户端（浏览器）只能通过 HTTPS 访问服务器，
    // 即使客户端尝试通过 HTTP 访问，也会被重定向到 HTTPS。这有助于防止降级攻击。
    app.UseHsts(); 
}

// 2. API 文档 (Swagger) 中间件
// `app.UseSwagger()`: 启用 Swagger JSON 端点。它会在 `/swagger/v1/swagger.json` 提供 OpenAPI 规范文件。
app.UseSwagger();
// `app.UseSwaggerUI()`: 启用 Swagger UI。它提供了一个交互式的 Web 页面，
// 可以可视化地浏览 API 文档，并直接在浏览器中测试 API。
// 即使在生产环境也开启，方便远程调试 API，但在某些情况下，出于安全考虑，生产环境可能只暴露 Swagger JSON，
// 或在反向代理层进行保护。
app.UseSwaggerUI();

// 3. 基础网络处理中间件
// `app.UseHttpsRedirection()`: 如果客户端使用 HTTP 协议访问，强制将其重定向到 HTTPS。
// 这确保了所有通信都经过加密，提升安全性。
app.UseHttpsRedirection(); 
// `app.UseStaticFiles()`: 允许应用程序服务静态文件，例如 HTML、CSS、JavaScript 文件，
// 以及这里可能包含的上传图片等。这些文件通常存放在 `wwwroot` 目录下。
app.UseStaticFiles();      

// 4. 请求日志记录中间件
// `app.UseSerilogRequestLogging()`: 使用之前配置的 Serilog 记录每个传入的 HTTP 请求的摘要信息，
// 例如请求方法 (GET, POST)、请求路径、响应状态码、处理耗时等。
// 这对于监控和调试应用程序非常有价值。
app.UseSerilogRequestLogging();

// 5. 路由中间件
// `app.UseRouting()`: 负责根据请求的 URL 路径，将其匹配到合适的端点（通常是某个 Controller 的 Action 方法）。
// 这个中间件必须在 `UseAuthentication` 和 `UseAuthorization` 之前，因为路由信息可能被认证/授权逻辑使用。
app.UseRouting();

// 6. 跨域策略中间件
// `app.UseCors("AllowNextJs")`: 应用之前在 `AddCors` 中定义的名为 "AllowNextJs" 的 CORS 策略。
// **重要**: 此中间件必须在 `UseRouting` 之后，`UseAuthentication` 之前，因为认证是基于请求头的，
// 而 CORS 可能会修改请求头。
app.UseCors("AllowNextJs");

// 7. 安全与权限中间件 (顺序不能颠倒！)
// `app.UseAuthentication()`: 这是“认证”中间件。它会检查请求中是否包含身份凭证（如 JWT Token），
// 并尝试验证这些凭证，以确定“你是谁？”。如果验证成功，会将用户身份信息附加到当前请求的上下文 (`HttpContext.User`) 中。
app.UseAuthentication(); 
// `app.UseAuthorization()`: 这是“授权”中间件。它会根据认证成功后的用户身份信息，
// 以及 Controller 或 Action 上配置的 `[Authorize]` 特性，来判断“你能否做这件事？”。
// 例如，只有 `Admin` 角色的用户才能访问某些管理接口。
// **顺序**: 认证必须在授权之前完成，因为授权需要知道请求者的身份。
app.UseAuthorization();  

// 8. 终点映射中间件
// `app.MapControllers()`: 将已经注册的 Controller 中的 Action 方法映射为具体的 API 端点。
// 当请求到达此处时，如果路由成功匹配，请求就会被分发到相应的 Controller 方法进行处理。
app.MapControllers();

// ==================================================================
// 第四阶段：数据初始化 (Data Seeding)
// ==================================================================
// `app.SeedDatabase()` 是一个我们自定义的扩展方法，定义在 `Extensions/DataSeeder.cs` 中。
// 作用：在应用程序启动时，自动执行数据库迁移（确保数据库结构与代码模型一致），
// 并检查数据库中是否已存在数据。如果数据库是空的，它会插入一些初始数据（例如默认分类、管理员用户等）。
// 这种方式非常适合开发环境和首次部署，可以确保数据库有一个可用状态。
app.SeedDatabase();

// ==================================================================
// 第五阶段：启动监听 (Run)
// ==================================================================

// 映射健康检查端点 (Docker HealthCheck 使用)
app.MapHealthChecks("/health");

// `app.Run()`: 这一行代码会启动 Web 应用程序，使其开始监听传入的 HTTP 请求。
// 应用程序会一直运行，直到被外部信号（例如 Ctrl+C）终止。
app.Run();