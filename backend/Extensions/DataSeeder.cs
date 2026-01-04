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

                // 播种站点内容配置 - 逐个检查并添加缺失的配置项
                SeedSiteContentIfNotExists(context, "homepage_intro", "主页介绍文字",
                    "欢迎来到 <strong>.NET 10</strong> ✖️ <strong>Next.js 16</strong> 的代码小窝！🚀<br/><br/>这儿不是什么严肃实验室，更像是一个全栈开发者的「玩乐高」现场：后端搭城堡，前端涂颜色，偶尔用 Docker 打包成礼物，扔到云上飘一飘～<br/><br/>不管你是摸爬滚打多年的技术大神，还是刚刚好奇探出小脑袋的新手，都欢迎来坐坐！茶水自备，代码共写——我家两只猫主子已经蹲在键盘旁监工了 🐱👩‍💻（它们主要负责给代码「踩踩」优化）<br/><br/>一起愉快地搞点有意思的东西吧！");

                SeedSiteContentIfNotExists(context, "about_intro", "关于我页面介绍",
                    "我相信最好的学习方式是「边做边学」——这个博客就是我的技术试验田 🌱<br/>专注于 <code>.NET 10</code> 与 <code>Next.js 16</code> 生态，从实战中总结经验，与你分享成长路上的点滴。欢迎一起交流！");

                // 关于页面配置项 - 使用 JSON 格式存储复杂数据
                SeedSiteContentIfNotExists(context, "about_author", "作者基本信息 (JSON)",
                    """{"name":"朱超凡","avatar":"https://files.zhuchaofan.com/CAT/boy_01.png","location":"日本·东京 (出向中)","description":"全栈开发者 / .NET / Next.js / 赴日修行中","social":{"github":"https://github.com/zhuuchaofan","twitter":"https://twitter.com/zhuchaofan","email":"zhuuchaofan@gmail.com"}}""");

                SeedSiteContentIfNotExists(context, "about_skills", "技能树 (JSON)",
                    """[{"title":"后端与数据库","skills":[{"name":".NET Framework / Core","icon":"Server","level":"精通"},{"name":"C#","icon":"Code2","level":"精通"},{"name":"Oracle DB","icon":"Database","level":"熟练"},{"name":"PostgreSQL","icon":"Database","level":"熟练"},{"name":"Legacy Migration","icon":"GitGraph","level":"熟练"},{"name":"Mainframe (Learning)","icon":"Server","level":"初学"}]},{"title":"前端 (业余)","skills":[{"name":"React","icon":"Layout","level":"掌握"},{"name":"Next.js 16","icon":"Globe","level":"掌握"},{"name":"TypeScript","icon":"Code2","level":"掌握"},{"name":"Tailwind CSS","icon":"Palette","level":"掌握"}]},{"title":"运维与工具","skills":[{"name":"Docker","icon":"Container","level":"掌握"},{"name":"Linux","icon":"Terminal","level":"掌握"},{"name":"Git","icon":"GitGraph","level":"熟练"},{"name":"iTerm","icon":"Terminal","level":"熟练"}]}]""");

                SeedSiteContentIfNotExists(context, "about_timeline", "个人经历 (JSON)",
                    """[{"year":"2026 (预计)","title":"回国发展","description":"计划结束出向任务回国，继续在技术领域深耕。"},{"year":"2025.02","title":"赴日出向","description":"来到日本富士通总部，投身大型机系统迁移项目，同时开启日语学习之旅。"},{"year":"2019","title":"入职富士通 (西安)","description":"正式步入职场。主要负责 .NET 版本升级与数据库移行 (Oracle -> PostgreSQL) 项目，积累了扎实的企业级开发经验。"}]""");

                SeedSiteContentIfNotExists(context, "about_books", "阅读书单 (JSON)",
                    """[{"title":"重构：改善既有代码的设计","status":"Reading","cover":"🔨"},{"title":"图解HTTP","status":"Reading","cover":"🌐"},{"title":"算法图解","status":"Reading","cover":"💡"}]""");

                SeedSiteContentIfNotExists(context, "about_gears", "装备清单 (JSON)",
                    """[{"category":"Hardware","items":["Mac mini M4"]},{"category":"Software","items":["JetBrains Rider","VS Code","iTerm","Docker Desktop","Obsidian"]}]""");

                SeedSiteContentIfNotExists(context, "about_pets", "宠物信息 (JSON)",
                    """[{"name":"球球","role":"CTO / 首席监工","avatar":"https://files.zhuchaofan.com/CAT/cat07_moyou_kijitora.png","description":"高冷狸花猫。代码审查极其严格，只要饭盆空了就会抛出 NullFoodException。"},{"name":"布丁","role":"HR / 气氛组","avatar":"https://files.zhuchaofan.com/CAT/cat01_moyou_black.png","description":"粘人黑猫。负责在深夜提供呼噜声白噪音，偶尔帮忙按压 Enter 键发布未完成的代码。"}]""");

                // 首页 Hero 区域配置
                SeedSiteContentIfNotExists(context, "homepage_slogan", "首页 Slogan",
                    "探索 • 记录 • 分享");
                
                SeedSiteContentIfNotExists(context, "homepage_title_suffix", "首页标题后缀",
                    "技术后花园");
                
                SeedSiteContentIfNotExists(context, "homepage_cta_primary", "首页主按钮文案",
                    "开始阅读");
                
                SeedSiteContentIfNotExists(context, "homepage_cta_secondary", "首页次要按钮文案",
                    "认识博主");

                // StatsWidget 组件配置
                SeedSiteContentIfNotExists(context, "stats_system_status", "系统监控-状态文案",
                    "系统运转正常");
                
                SeedSiteContentIfNotExists(context, "stats_total_visits", "系统监控-访问量文案",
                    "累计访问量");
                
                SeedSiteContentIfNotExists(context, "stats_server_time", "系统监控-时间文案",
                    "服务器时间");

                // 关于页面-致谢部分配置
                SeedSiteContentIfNotExists(context, "about_thanks_title", "关于页面-致谢标题",
                    "致我的女朋友");
                
                SeedSiteContentIfNotExists(context, "about_thanks_content", "关于页面-致谢内容",
                    "感谢你在中国对我全方位的支持与陪伴。即使相隔千里，你的鼓励与理解始终是我前行的动力。这个博客的每一行代码、每一篇文章，都承载着你的温暖与祝福。❤️");

                // 系统配置
                SeedSiteContentIfNotExists(context, "site_launch_date", "网站起始日期",
                    "2025-12-01");

                // 播种邮件模板
                SeedEmailTemplates(context);
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

    /// <summary>
    /// 辅助方法：如果指定 Key 的站点内容不存在，则创建它
    /// </summary>
    private static void SeedSiteContentIfNotExists(AppDbContext context, string key, string description, string value)
    {
        if (!context.SiteContents.Any(c => c.Key == key))
        {
            context.SiteContents.Add(new SiteContent
            {
                Key = key,
                Description = description,
                Value = value
            });
            context.SaveChanges();
        }
    }

    /// <summary>
    /// 播种邮件模板
    /// </summary>
    private static void SeedEmailTemplates(AppDbContext context)
    {
        var baseStyle = "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px; background-color: #ffffff;";
        var footerStyle = "margin-top: 30px; font-size: 12px; color: #6a737d; text-align: center;";

        var defaultTemplates = new List<EmailTemplate>
        {
            // 1. 新评论通知（站长）
            new EmailTemplate
            {
                TemplateKey = "new_comment",
                Name = "新评论通知",
                SubjectTemplate = "💬 [新评论] {{PostTitle}}",
                BodyTemplate = $@"
<div style='{baseStyle}'>
    <div style='border-bottom: 2px solid #0366d6; padding-bottom: 15px; margin-bottom: 20px;'>
        <h2 style='margin: 0; color: #0366d6; font-size: 20px;'>New Comment Notification</h2>
    </div>
    <div style='color: #24292e; line-height: 1.6;'>
        <p>您的文章 <strong>{{{{PostTitle}}}}</strong> 收到了新的评论：</p>
        <div style='background-color: #f6f8fa; border-left: 4px solid #0366d6; padding: 15px; margin: 15px 0; color: #586069;'>
            {{{{Content}}}}
        </div>
        <p style='font-size: 14px; color: #586069;'>By: <strong>{{{{GuestName}}}}</strong></p>
    </div>
    <div style='margin-top: 25px; text-align: center;'>
        <a href='{{{{AppUrl}}}}/posts/{{{{PostId}}}}#comment-{{{{CommentId}}}}' style='display: inline-block; background-color: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>查看详情</a>
    </div>
    <div style='{footerStyle}'>
        © MyNextBlog Automated System
    </div>
</div>",
                AvailablePlaceholders = """{"PostTitle":"文章标题","Content":"评论内容","GuestName":"评论者名称","PostId":"文章ID","CommentId":"评论ID","AppUrl":"站点地址"}""",
                Description = "当文章收到新评论时，发送邮件通知站长",
                IsEnabled = true
            },

            // 2. 敏感词评论审核通知
            new EmailTemplate
            {
                TemplateKey = "spam_comment",
                Name = "敏感词审核通知",
                SubjectTemplate = "🚨 [待审核] 敏感词拦截：{{PostTitle}}",
                BodyTemplate = $@"
<div style='{baseStyle}'>
    <div style='border-bottom: 2px solid #d73a49; padding-bottom: 15px; margin-bottom: 20px;'>
        <h2 style='margin: 0; color: #d73a49; font-size: 20px;'>⚠️ 新评论需审核</h2>
    </div>
    <div style='color: #24292e; line-height: 1.6;'>
        <p><strong>文章：</strong> {{{{PostTitle}}}}</p>
        <p><strong>用户：</strong> {{{{GuestName}}}}</p>
        <div style='background-color: #fffbdd; border-left: 4px solid #d73a49; padding: 15px; margin: 15px 0; color: #586069;'>
            {{{{Content}}}}
        </div>
    </div>
    <div style='margin-top: 25px; text-align: center;'>
        <a href='{{{{AppUrl}}}}/admin/comments' style='display: inline-block; background-color: #d73a49; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>前往后台审核</a>
    </div>
    <div style='{footerStyle}'>
        © MyNextBlog Automated System
    </div>
</div>",
                AvailablePlaceholders = """{"PostTitle":"文章标题","Content":"评论内容","GuestName":"评论者名称","AppUrl":"站点地址"}""",
                Description = "当评论触发敏感词拦截时，发送邮件给站长待审核",
                IsEnabled = true
            },

            // 3. 回复通知
            new EmailTemplate
            {
                TemplateKey = "reply_notification",
                Name = "回复通知",
                SubjectTemplate = "👋 您的评论在 [{{PostTitle}}] 收到了回复",
                BodyTemplate = $@"
<div style='{baseStyle}'>
    <div style='border-bottom: 2px solid #28a745; padding-bottom: 15px; margin-bottom: 20px;'>
        <h2 style='margin: 0; color: #28a745; font-size: 20px;'>New Reply</h2>
    </div>
    <div style='color: #24292e; line-height: 1.6;'>
        <p>亲爱的 <strong>{{{{RecipientName}}}}</strong>，</p>
        <p>您在文章 <strong>{{{{PostTitle}}}}</strong> 下的评论有了新的回复：</p>
        <div style='background-color: #f6f8fa; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; color: #586069;'>
            {{{{Content}}}}
        </div>
        <p style='font-size: 14px; color: #586069;'>By: <strong>{{{{GuestName}}}}</strong></p>
    </div>
    <div style='margin-top: 25px; text-align: center;'>
        <a href='{{{{AppUrl}}}}/posts/{{{{PostId}}}}#comment-{{{{CommentId}}}}' style='display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>回复</a>
    </div>
    <div style='{footerStyle}'>
        © MyNextBlog Automated System
    </div>
</div>",
                AvailablePlaceholders = """{"RecipientName":"收件人名称","PostTitle":"文章标题","Content":"回复内容","GuestName":"回复者名称","PostId":"文章ID","CommentId":"评论ID","AppUrl":"站点地址"}""",
                Description = "当用户的评论被回复时，发送邮件通知该用户",
                IsEnabled = true
            },

            // 4. 纪念日提醒
            new EmailTemplate
            {
                TemplateKey = "anniversary_reminder",
                Name = "纪念日提醒",
                SubjectTemplate = "💕 纪念日提醒：「{{Title}}」还有 {{DaysBefore}} 天",
                BodyTemplate = $@"
<div style='{baseStyle}'>
    <div style='border-bottom: 2px solid #ec4899; padding-bottom: 15px; margin-bottom: 20px;'>
        <h2 style='margin: 0; color: #ec4899; font-size: 20px;'>{{{{Emoji}}}} {{{{Title}}}}</h2>
    </div>
    <div style='color: #24292e; line-height: 1.6;'>
        <p style='font-size: 18px; color: #333;'>距离纪念日还有 <strong>{{{{DaysBefore}}}}</strong> 天</p>
        <div style='background-color: #fdf2f8; border-left: 4px solid #ec4899; padding: 15px; margin: 15px 0; border-radius: 8px;'>
            <p style='margin: 8px 0;'><strong>📅 日期：</strong>{{{{TargetDate}}}}</p>
            <p style='margin: 8px 0;'><strong>⏰ 起始日期：</strong>{{{{StartDate}}}}</p>
            <p style='margin: 8px 0;'><strong>💗 已经：</strong>{{{{DaysTotal}}}} 天</p>
        </div>
    </div>
    <div style='{footerStyle}'>
        —— 来自 MyNextBlog 的温馨提醒
    </div>
</div>",
                AvailablePlaceholders = """{"Title":"纪念日标题","Emoji":"图标","TargetDate":"目标日期","StartDate":"起始日期","DaysBefore":"剩余天数","DaysTotal":"已过天数"}""",
                Description = "在纪念日临近时，发送邮件提醒",
                IsEnabled = true
            },

            // 5. 计划提醒
            new EmailTemplate
            {
                TemplateKey = "plan_reminder",
                Name = "计划提醒",
                SubjectTemplate = "📅 计划提醒：「{{PlanTitle}}」还有 {{DaysRemaining}} 天",
                BodyTemplate = $@"
<div style='{baseStyle}'>
    <div style='border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;'>
        <h2 style='margin: 0; color: #3b82f6; font-size: 20px;'>📅 {{{{PlanTitle}}}}</h2>
    </div>
    <div style='color: #24292e; line-height: 1.6;'>
        <p style='font-size: 18px; color: #333;'>距离出发还有 <strong>{{{{DaysRemaining}}}}</strong> 天</p>
        <div style='background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 8px;'>
            <p style='margin: 8px 0;'><strong>📆 日期：</strong>{{{{StartDate}}}} ~ {{{{EndDate}}}}</p>
            <p style='margin: 8px 0;'><strong>💰 预算：</strong>{{{{Budget}}}}</p>
            <p style='margin: 8px 0;'><strong>📋 行程概要：</strong></p>
            <div style='margin-left: 15px;'>{{{{DaysSummary}}}}</div>
        </div>
    </div>
    <div style='{footerStyle}'>
        —— 来自 MyNextBlog 的温馨提醒
    </div>
</div>",
                AvailablePlaceholders = """{"PlanTitle":"计划标题","StartDate":"开始日期","EndDate":"结束日期","DaysRemaining":"剩余天数","Budget":"预算金额","DaysSummary":"行程概要"}""",
                Description = "在计划临近时，发送邮件提醒",
                IsEnabled = true
            },

            // 6. 订单创建通知
            new EmailTemplate
            {
                TemplateKey = "order_created",
                Name = "订单创建通知",
                SubjectTemplate = "🛒 订单创建成功：{{OrderNo}}",
                BodyTemplate = $@"
<div style='{baseStyle}'>
    <div style='border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;'>
        <h2 style='margin: 0; color: #10b981; font-size: 20px;'>✅ 订单创建成功</h2>
    </div>
    <div style='color: #24292e; line-height: 1.6;'>
        <p>订单号：<strong>{{{{OrderNo}}}}</strong></p>
        <p>下单时间：{{{{CreateTime}}}}</p>
        <h3 style='margin-top: 20px; font-size: 16px;'>商品清单</h3>
        {{{{Items}}}}
        <p style='font-size: 18px; margin-top: 20px; text-align: right;'>
            总金额：<strong style='color: #10b981;'>¥{{{{TotalAmount}}}}</strong>
        </p>
    </div>
    <div style='background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;'>
        <p style='margin: 0; color: #92400e;'>⏰ 请尽快完成付款，避免订单超时取消。</p>
    </div>
    <div style='{footerStyle}'>
        © MyNextBlog Shop
    </div>
</div>",
                AvailablePlaceholders = """{\"OrderNo\":\"订单号\",\"CreateTime\":\"下单时间\",\"Items\":\"商品清单HTML\",\"TotalAmount\":\"总金额\"}""",
                Description = "用户下单成功后，发送订单确认邮件",
                IsEnabled = true
            },

            // 7. 订单完成通知（含下载链接）
            new EmailTemplate
            {
                TemplateKey = "order_completed",
                Name = "订单完成通知",
                SubjectTemplate = "🎉 付款成功 - 您的商品已发货：{{OrderNo}}",
                BodyTemplate = $@"
<div style='{baseStyle}'>
    <div style='border-bottom: 2px solid #8b5cf6; padding-bottom: 15px; margin-bottom: 20px;'>
        <h2 style='margin: 0; color: #8b5cf6; font-size: 20px;'>🎉 付款成功，商品已发货！</h2>
    </div>
    <div style='color: #24292e; line-height: 1.6;'>
        <p>订单号：<strong>{{{{OrderNo}}}}</strong></p>
        <p>付款时间：{{{{PaidTime}}}}</p>
        <p>支付金额：<strong style='color: #8b5cf6;'>¥{{{{TotalAmount}}}}</strong></p>
        
        <h3 style='margin-top: 25px; font-size: 16px; color: #10b981;'>📥 下载链接</h3>
        {{{{DownloadLinks}}}}
        
        <h3 style='margin-top: 25px; font-size: 16px; color: #f59e0b;'>🔑 兑换码</h3>
        {{{{RedeemCodes}}}}
    </div>
    <div style='background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 20px;'>
        <p style='margin: 0; color: #166534;'>💡 请妥善保存以上信息，下载链接长期有效。</p>
    </div>
    <div style='{footerStyle}'>
        感谢您的支持！—— MyNextBlog Shop
    </div>
</div>",
                AvailablePlaceholders = """{\"OrderNo\":\"订单号\",\"PaidTime\":\"付款时间\",\"TotalAmount\":\"支付金额\",\"DownloadLinks\":\"下载链接HTML\",\"RedeemCodes\":\"兑换码HTML\"}""",
                Description = "用户付款成功后，发送包含下载链接和兑换码的邮件",
                IsEnabled = true
            }
        };


        // 获取现有模板（避免每次循环都查库）
        var existingTemplates = context.EmailTemplates.ToDictionary(t => t.TemplateKey);

        foreach (var def in defaultTemplates)
        {
            if (!existingTemplates.TryGetValue(def.TemplateKey, out var existing))
            {
                // 如果模板不存在，则添加
                context.EmailTemplates.Add(def);
            }
            else
            {
                // 如果模板存在，仅更新缺失的元数据（不覆盖用户修改的内容）
                // 1. Description 更新
                if (string.IsNullOrEmpty(existing.Description) && !string.IsNullOrEmpty(def.Description))
                {
                    existing.Description = def.Description;
                }
                
                // 2. AvailablePlaceholders 更新（保持文档最新）
                if (string.IsNullOrEmpty(existing.AvailablePlaceholders) && !string.IsNullOrEmpty(def.AvailablePlaceholders))
                {
                    existing.AvailablePlaceholders = def.AvailablePlaceholders;
                }
                
                // 注意：永远不更新 SubjectTemplate, BodyTemplate, IsEnabled, Name
                // 因为这些用户可能自定义过
            }
        }

        context.SaveChanges();
    }
}
