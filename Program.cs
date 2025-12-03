using Microsoft.EntityFrameworkCore;
using MyTechBlog.Data;
using MyTechBlog.Services;

var builder = WebApplication.CreateBuilder(args);

// ==================================================================
// 第一阶段：招募员工与采购设备 (服务注册 / Dependency Injection)
// 就像餐厅开业前，先把厨师、服务员、食材、餐具都准备好。
// ==================================================================

// Add services to the container.
builder.Services.AddControllersWithViews();

// 注册 PostService
builder.Services.AddScoped<IPostService, PostService>();
// 注册 R2存储服务
builder.Services.AddScoped<IStorageService, R2StorageService>();
// 注册 ImageService
builder.Services.AddScoped<IImageService, ImageService>();
// 注册 CategoryService
builder.Services.AddScoped<ICategoryService, CategoryService>();

// 配置数据库 context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// 4. 招募“保安” (身份认证服务)
// 开启 Cookie 认证。如果没登录，就踢到登录页。
builder.Services.AddAuthentication("MyCookieAuth")
    .AddCookie("MyCookieAuth", options =>
    {
        options.LoginPath = "/Account/Login"; 
        options.AccessDeniedPath = "/Account/Login";
    });

// ==================================================================
// 第二阶段：建设餐厅 (Build)
// ==================================================================
var app = builder.Build();

// ==================================================================
// 第三阶段：制定接待流程 (Middleware Pipeline)
// 当客人 (HTTP请求) 进来时，要按什么顺序接待。
// ==================================================================

// 1. 异常处理 (出事了怎么办)
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error"); // 生产环境显示友好的错误页
    app.UseHsts(); // 强制使用安全协议
}

// 2. 启用 HTTPS 跳转 (把客人从后门带到正门)
app.UseHttpsRedirection();

// 3. 开放静态资源 (允许客人拿取菜单、餐巾纸)
// 允许访问 wwwroot 文件夹下的 css, js, 图片等文件
app.UseStaticFiles();

// 4. 路由匹配 (保安看门票，决定带去哪个房间)
app.UseRouting();

// 5. 查验身份 (必须放在 UseRouting 之后)
app.UseAuthentication(); // 问：你是谁？(查身份证/Cookie)
app.UseAuthorization();  // 问：你能干什么？(查权限/Role)

// 6. 最终目的地 (默认规则)
// 如果没指定去哪，默认去 HomeController 的 Index 方法
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// ==================================================================
// 3.5. 数据播种 (Data Seeding)
// 确保数据库已创建，并且有一些默认数据
// ==================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        // 自动应用最新的迁移 (这就不用在 Debian 上手动运行 update database 了)
        context.Database.Migrate();

        // 如果没有分类，就添加默认分类
        if (!context.Categories.Any())
        {
            context.Categories.AddRange(
                new MyTechBlog.Models.Category { Name = ".NET 技术" },
                new MyTechBlog.Models.Category { Name = "架构心得" },
                new MyTechBlog.Models.Category { Name = "前端开发" },
                new MyTechBlog.Models.Category { Name = "生活随笔" }
            );
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating the DB.");
    }
}

// ==================================================================
// 第四阶段：正式营业 (Run)
// 程序进入死循环，监听端口，等待请求。
// ==================================================================
app.Run();
