using Microsoft.EntityFrameworkCore;
using MyTechBlog.Data;
using MyTechBlog.Services;

var builder = WebApplication.CreateBuilder(args);

// ==================================================================
// 第一阶段：招募员工与采购设备 (服务注册 / Dependency Injection)
// 就像餐厅开业前，先把厨师、服务员、食材、餐具都准备好。
// ==================================================================

// 1. 连接“数据库仓库” (AppDbContext)
// 系统会去 appsettings.json 找 "DefaultConnection" 来连接 SQLite 数据库。
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. 招募“文章大厨” (注册自定义业务服务)
// AddScoped: “一次请求用同一个实例”。比如一个用户访问页面，全过程用同一个 PostService 对象。
builder.Services.AddScoped<IPostService, PostService>();

// 3. 招募“视图渲染员” (MVC 控制器和视图)
// 告诉系统我们要用 Controller 处理逻辑，用 View 显示页面。
builder.Services.AddControllersWithViews();

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
// 第四阶段：正式营业 (Run)
// 程序进入死循环，监听端口，等待请求。
// ==================================================================
app.Run();
