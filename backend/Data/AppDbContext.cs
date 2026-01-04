// `using` 语句用于导入必要的命名空间。
using Microsoft.EntityFrameworkCore; // 引入 Entity Framework Core 核心类型
using MyNextBlog.Models;            // 引入应用程序的领域模型，如 Post, Comment, User 等

// `namespace` 声明了当前文件中的代码所属的命名空间。
namespace MyNextBlog.Data;

/// <summary>
/// `AppDbContext` 是 Entity Framework Core (EF Core) 中的核心类，被称为“数据库上下文”。
/// 它可以被看作是应用程序与数据库之间的“会话”或“桥梁”。
/// 它的主要职责包括：
///   - **管理数据库连接**: 封装了数据库连接字符串和连接管理。
///   - **跟踪实体状态**: 知道哪些实体是新的、哪些被修改了、哪些要被删除。
///   - **查询数据库**: 提供 `DbSet` 属性，用于构建和执行 LINQ 查询。
///   - **保存数据**: 将内存中的实体对象变化同步到数据库。
/// </summary>
// `public class AppDbContext(...) : DbContext(options)`:
//   - `AppDbContext` 继承自 EF Core 提供的 `DbContext` 基类。
//   - `DbContextOptions<AppDbContext> options`: 这是通过依赖注入 (DI) 传入的配置选项，
//     它告诉 `AppDbContext` 应该连接哪个数据库、使用哪个数据库提供者 (例如 SQLite)。
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // --- DbSet 属性 ---
    // 每个 `DbSet<TEntity>` 属性都代表了数据库中的一张表（或集合）。
    // `TEntity` 是你的领域模型类（例如 `Post`），它会被映射到数据库中的相应表。
    // 通过这些 `DbSet`，我们可以对数据库进行 CRUD (创建、读取、更新、删除) 操作。
    public DbSet<Post> Posts { get; set; }           // 对应数据库中的 Posts 表，用于管理文章
    public DbSet<Comment> Comments { get; set; }       // 对应数据库中的 Comments 表，用于管理评论
    public DbSet<User> Users { get; set; }           // 对应数据库中的 Users 表，用于管理用户
    
    public DbSet<Category> Categories { get; set; }   // 对应数据库中的 Categories 表，用于管理文章分类
    public DbSet<Tag> Tags { get; set; }             // 对应数据库中的 Tags 表，用于管理文章标签
    public DbSet<ImageAsset> ImageAssets { get; set; } // 对应数据库中的 ImageAssets 表，用于管理图片资源
    public DbSet<PostLike> PostLikes { get; set; }    // 对应数据库中的 PostLikes 表，用于管理文章点赞
    public DbSet<UserProfile> UserProfiles { get; set; } // 新增：用户扩展资料
    public DbSet<Series> Series { get; set; } // 系列
    public DbSet<SiteContent> SiteContents { get; set; } // 站点内容配置
    public DbSet<RefreshToken> RefreshTokens { get; set; } // Refresh Token 多设备登录支持
    public DbSet<Anniversary> Anniversaries { get; set; } // 纪念日
    public DbSet<AnniversaryNotification> AnniversaryNotifications { get; set; } // 纪念日提醒记录
    public DbSet<EmailTemplate> EmailTemplates { get; set; } // 邮件模板
    
    // --- 计划功能 ---
    public DbSet<Plan> Plans { get; set; } // 计划主表
    public DbSet<PlanDay> PlanDays { get; set; } // 每日行程
    public DbSet<PlanActivity> PlanActivities { get; set; } // 活动项
    
    // --- 购物功能 ---
    public DbSet<Product> Products { get; set; } // 商品
    public DbSet<Order> Orders { get; set; } // 订单
    public DbSet<OrderItem> OrderItems { get; set; } // 订单项

    /// <summary>
    /// `OnModelCreating` 方法是 EF Core 的一个**核心配置方法**。
    /// 它在 `DbContext` 第一次被创建时调用，用于配置模型的映射关系。
    /// 在这里，我们可以使用 "Fluent API"（流式接口）来更精细地控制数据库表的结构、
    /// 实体属性的映射以及实体之间的关系（如一对多、多对多、级联删除等）。
    /// 就像是装修时的详细施工图纸，规定了实体如何映射到数据库的每一处细节。
    /// </summary>
    /// <param name="modelBuilder">用于构建模型的 API 实例。</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 调用基类的 `OnModelCreating` 方法，确保 EF Core 的默认配置被应用。
        base.OnModelCreating(modelBuilder);

        // --- 1. 配置 Post (文章) 与 Tag (标签) 的多对多关系 ---
        // 解释：在博客系统中，一篇文章可以有多个标签，一个标签也可以属于多篇文章。
        // EF Core 默认会创建一张连接表（通常命名为 `PostTag` 或 `TagPost`）来表示这种关系。
        modelBuilder.Entity<Post>()                   // 从 `Post` 实体开始配置
            .HasMany(p => p.Tags)                     // `Post` 有多个 `Tag` (通过 `Post.Tags` 导航属性)
            .WithMany(t => t.Posts)                   // `Tag` 也有多个 `Post` (通过 `Tag.Posts` 导航属性)
            .UsingEntity(j => j.ToTable("PostTag"));  // `UsingEntity` 用于配置连接表。
                                                      // `j.ToTable("PostTag")` 显式指定连接表的名称为 "PostTag"。
                                                      // 这是为了匹配数据库中已存在的表名。

        // --- 2. 配置 Category (分类) 与 Post (文章) 的一对多关系 ---
        // 解释：一个分类下可以有多篇文章，但一篇文章只属于一个分类。
        modelBuilder.Entity<Category>()               // 从 `Category` 实体开始配置
            .HasMany(c => c.Posts)                    // `Category` 有多个 `Post` (通过 `Category.Posts` 导航属性)
            .WithOne(p => p.Category)                 // `Post` 有一个 `Category` (通过 `Post.Category` 导航属性)
            .HasForeignKey(p => p.CategoryId)         // `Post` 中的 `CategoryId` 是外键
            .OnDelete(DeleteBehavior.SetNull);        // **级联删除行为配置**:
                                                      // `OnDelete(DeleteBehavior.SetNull)` 意味着：
                                                      // 如果一个 `Category` 被删除了，那么所有原本属于这个分类的 `Post` 的 `CategoryId`
                                                      // 将会被设置为 `NULL`。文章本身不会被删除，只是变成了"未分类"状态。
                                                      // 这是相对安全的级联删除策略，避免误删数据。

        // --- 3. 配置 Post (文章) 与 Comment (评论) 的一对多关系 ---
        // 解释：一篇文章可以有多个评论，但一个评论只属于一篇文章。
        modelBuilder.Entity<Post>()                   // 从 `Post` 实体开始配置
            .HasMany(p => p.Comments)                 // `Post` 有多个 `Comment` (通过 `Post.Comments` 导航属性)
            .WithOne(c => c.Post)                     // `Comment` 有一个 `Post` (通过 `Comment.Post` 导航属性)
            .HasForeignKey(c => c.PostId)             // `Comment` 中的 `PostId` 是外键
            .OnDelete(DeleteBehavior.Cascade);        // **级联删除行为配置**:
                                                      // `OnDelete(DeleteBehavior.Cascade)` 意味着：
                                                      // 如果一个 `Post` 被删除了，那么所有属于这个 `Post` 的 `Comment` 也会
                                                      // **被自动删除**。这是一种"强"级联删除，需谨慎使用。

        // --- 4. 索引配置 (Performance Indexes) ---
        // 为高频查询字段创建索引，提升查询性能
        modelBuilder.Entity<Post>()
            .HasIndex(p => p.IsHidden);          // 优化可见性过滤
        modelBuilder.Entity<Post>()
            .HasIndex(p => p.CreateTime);        // 优化按时间排序
        
        modelBuilder.Entity<Comment>()

            .HasIndex(c => c.ParentId);          // 优化子评论查找

        // --- 5. 配置 User (用户) 与 UserProfile (扩展资料) 的一对一关系 ---
        modelBuilder.Entity<User>(entity =>
        {
            // Email 唯一索引（允许 NULL，但不允许重复）
            entity.HasIndex(u => u.Email)
                .IsUnique()
                .HasFilter("\"Email\" IS NOT NULL"); // SQLite/PostgreSQL 语法

            entity.HasOne(u => u.UserProfile)
                .WithOne(p => p.User)
                .HasForeignKey<UserProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade); // 用户删除时，扩展资料也删除
        });

        // --- 6. 配置 Series (系列) 与 Post (文章) 的一对多关系 ---
        modelBuilder.Entity<Series>()
            .HasMany(s => s.Posts)
            .WithOne(p => p.Series)
            .HasForeignKey(p => p.SeriesId)
            .OnDelete(DeleteBehavior.SetNull); // 删除系列时，文章不删，只是解除关系

        // --- 7. 配置 SiteContent (站点内容) ---
        modelBuilder.Entity<SiteContent>()
            .HasIndex(s => s.Key)
            .IsUnique(); // Key 必须唯一

        // --- 8. 配置 User 与 RefreshToken 的一对多关系 (多设备登录) ---
        modelBuilder.Entity<User>()
            .HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade); // 用户删除时，所有 Token 也删除
        
        // 为 RefreshToken 添加索引
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.UserId); // 优化按用户查询
        
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.ExpiryTime); // 优化清理过期 Token
        
        // --- 9. 配置 Plan 与 Anniversary 的可选关联 ---
        modelBuilder.Entity<Plan>()
            .HasOne(p => p.Anniversary)
            .WithMany()
            .HasForeignKey(p => p.AnniversaryId)
            .OnDelete(DeleteBehavior.SetNull); // 删除纪念日时，计划不删，只是解除关系
        
        // --- 10. 配置 Plan 与 PlanDay 的一对多关系 ---
        modelBuilder.Entity<Plan>()
            .HasMany(p => p.Days)
            .WithOne(d => d.Plan)
            .HasForeignKey(d => d.PlanId)
            .OnDelete(DeleteBehavior.Cascade); // 删除计划时，所有日程也删除
        
        // --- 11. 配置 PlanDay 与 PlanActivity 的一对多关系 ---
        modelBuilder.Entity<PlanDay>()
            .HasMany(d => d.Activities)
            .WithOne(a => a.PlanDay)
            .HasForeignKey(a => a.PlanDayId)
            .OnDelete(DeleteBehavior.Cascade); // 删除日程时，所有活动也删除
        
        // 为 Plan 添加索引
        modelBuilder.Entity<Plan>()
            .HasIndex(p => p.StartDate); // 优化按日期查询
        
        // --- 12. 配置 Order 订单相关关系 ---
        modelBuilder.Entity<Order>(entity =>
        {
            // 订单号唯一索引
            entity.HasIndex(o => o.OrderNo).IsUnique();
            
            // 用户ID索引（优化我的订单查询）
            entity.HasIndex(o => o.UserId);
            
            // 订单与用户的多对一关系
            entity.HasOne(o => o.User)
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict); // 防止误删用户时删除订单
            
            // 订单与订单项的一对多关系
            entity.HasMany(o => o.Items)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade); // 删除订单时，订单项也删除
        });
        
        // --- 13. 配置 OrderItem 订单项关系 ---
        modelBuilder.Entity<OrderItem>(entity =>
        {
            // 订单项与商品的多对一关系
            entity.HasOne(oi => oi.Product)
                .WithMany(p => p.OrderItems)
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict); // 防止删除有订单的商品
        });
        
        // --- 14. 配置 Product 商品索引 ---
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.IsActive); // 优化上架商品查询
    }
}