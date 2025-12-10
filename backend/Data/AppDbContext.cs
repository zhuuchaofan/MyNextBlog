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
                                                      // 将会被设置为 `NULL`。文章本身不会被删除，只是变成了“未分类”状态。
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
                                                      // **被自动删除**。这是一种“强”级联删除，需谨慎使用。
    }
}