using Microsoft.EntityFrameworkCore;
using MyTechBlog.Data;
using MyTechBlog.Services;

var builder = WebApplication.CreateBuilder(args);

// 配置数据库上下文，使用 SQLite 数据库
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// 注册我们的业务服务 (Scoped 表示每个 HTTP 请求创建一个新的实例)
builder.Services.AddScoped<IPostService, PostService>();

// Add services to the container.
builder.Services.AddControllersWithViews();

// 添加认证服务
builder.Services.AddAuthentication("MyCookieAuth")
    .AddCookie("MyCookieAuth", options =>
    {
        options.LoginPath = "/Account/Login"; // 如果没登录就踢到这个页面
        options.AccessDeniedPath = "/Account/Login";
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// --- 2. 启用中间件 ---
app.UseAuthentication(); // 问：你是谁？(查身份证)
app.UseAuthorization();  // 问：你能干什么？(查权限)

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
