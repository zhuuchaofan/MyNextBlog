using Microsoft.EntityFrameworkCore;
using MyTechBlog.Models;

namespace MyTechBlog.Data;

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
    public DbSet<ImageAsset> ImageAssets { get; set; }
}