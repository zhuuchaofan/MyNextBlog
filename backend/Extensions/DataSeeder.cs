using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Extensions;

/// <summary>
/// 数据库播种扩展类
/// 作用：在程序启动时自动检查数据库状态，应用迁移，并预置初始数据。
/// 这就像餐厅开业前，经理先检查装修是否完成，然后在菜单上写上第一批推荐菜。
/// </summary>
public static class DataSeederExtensions
{
    /// <summary>
    /// 扩展方法：为 WebApplication 添加数据库播种功能
    /// </summary>
    /// <param name="app">当前的 Web 应用程序实例</param>
    public static void SeedDatabase(this WebApplication app)
    {
        // 创建一个临时的服务作用域 (Scope)
        // 解释：在 ASP.NET Core 中，很多服务（如数据库上下文 AppDbContext）是 "Scoped" (请求级) 的。
        // 而 Program.cs 是在应用启动时运行，还没有 HTTP 请求进来，所以我们需要手动创建一个作用域，
        // 假装我们在处理一个请求，这样才能拿到 AppDbContext 的实例。
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                // 从容器中获取数据库上下文 (AppDbContext)
                // 这就是我们操作数据库的“遥控器”
                var context = services.GetRequiredService<AppDbContext>();

                // 1. 自动应用迁移 (Auto Migration)
                // 检查代码中的模型变化，并同步到数据库。
                // 好处：部署到新环境（如 Docker 容器）时，不需要手动运行 update-database 命令，程序一跑起来数据库就自动建好了。
                context.Database.Migrate();

                // 2. 数据播种 (Data Seeding)
                // 检查数据库里是否已经有数据，如果没有，就填入一些默认值。
                
                // 检查：如果有任何分类存在，说明不是第一次运行，直接跳过
                if (!context.Categories.Any())
                {
                    // 添加默认分类
                    // AddRange 可以一次性添加多个对象
                    context.Categories.AddRange(
                        new Category { Name = ".NET 技术" },
                        new Category { Name = "架构心得" },
                        new Category { Name = "前端开发" },
                        new Category { Name = "生活随笔" }
                    );

                    // 重要：保存更改！
                    // 所有的 Add/Update 操作都只是在内存中标记，只有调用 SaveChanges 才会生成 SQL 语句并发给数据库。
                    context.SaveChanges();
                }

                // 播种站点内容配置
                if (!context.SiteContents.Any())
                {
                    context.SiteContents.AddRange(
                        new SiteContent 
                        { 
                            Key = "homepage_intro", 
                            Description = "主页介绍文字",
                            Value = "欢迎来到 <strong>.NET 10</strong> ✖️ <strong>Next.js 16</strong> 的代码小窝！🚀<br/><br/>这儿不是什么严肃实验室，更像是一个全栈开发者的「玩乐高」现场：后端搭城堡，前端涂颜色，偶尔用 Docker 打包成礼物，扔到云上飘一飘～<br/><br/>不管你是摸爬滚打多年的技术大神，还是刚刚好奇探出小脑袋的新手，都欢迎来坐坐！茶水自备，代码共写——我家两只猫主子已经蹲在键盘旁监工了 🐱👩‍💻（它们主要负责给代码「踩踩」优化）<br/><br/>一起愉快地搞点有意思的东西吧！"
                        },
                        new SiteContent 
                        { 
                            Key = "about_intro", 
                            Description = "关于我页面介绍",
                            Value = "我相信最好的学习方式是「边做边学」——这个博客就是我的技术试验田 🌱<br/>专注于 <code>.NET 10</code> 与 <code>Next.js 16</code> 生态，从实战中总结经验，与你分享成长路上的点滴。欢迎一起交流！"
                        }
                    );
                    context.SaveChanges();
                }
            }
            catch (Exception ex)
            {
                // 如果出错（比如数据库连接失败），记录日志
                // ILogger 是系统内置的日志记录器
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred while migrating or seeding the database.");
            }
        }
    }
}
