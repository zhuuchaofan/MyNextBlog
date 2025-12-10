using Microsoft.EntityFrameworkCore;
using MyNextBlog.Models;

namespace MyNextBlog.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet 代表数据库中的一张表
    // 每个实体类对应一张表
    // 比如 Post 实体类对应 Posts 表
    // Comment 实体类对应 Comments 表
    public DbSet<Post> Posts { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<User> Users { get; set; }
    
    public DbSet<Category> Categories { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<ImageAsset> ImageAssets { get; set; }

    /// <summary>
    /// 模型构建器 (OnModelCreating)
    /// 作用：这是 EF Core 的核心配置方法。在这里，我们使用 "Fluent API" (流式接口) 来精细控制数据库表的结构和关系。
    /// 就像是装修时的详细施工图，规定了墙要多厚、水管怎么接。
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- 1. 配置 Post (文章) 与 Tag (标签) 的多对多关系 ---
        // 解释：一篇文章有多个标签，一个标签也属于多篇文章。
        // EF Core 会自动创建一张中间表 (通常叫 PostTag)。
        modelBuilder.Entity<Post>()
            .HasMany(p => p.Tags)
            .WithMany(t => t.Posts)
            .UsingEntity(j => j.ToTable("PostTag")); // 修正：匹配现有数据库表名 "PostTag"

        // --- 2. 配置 Category (分类) 与 Post (文章) 的一对多关系 ---
        // 解释：一个分类下有多篇文章，一篇文章属于一个分类。
        modelBuilder.Entity<Category>()
            .HasMany(c => c.Posts)
            .WithOne(p => p.Category)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.SetNull); // 关键：如果分类被删了，文章的 CategoryId 会变成 NULL (变成未分类)，而不会被删除。

        // --- 3. 配置 Post (文章) 与 Comment (评论) 的一对多关系 ---
        modelBuilder.Entity<Post>()
            .HasMany(p => p.Comments)
            .WithOne(c => c.Post)
            .HasForeignKey(c => c.PostId)
            .OnDelete(DeleteBehavior.Cascade); // 关键：如果文章被删了，它下面的评论也会被全部删除 (级联删除)。
    }
}