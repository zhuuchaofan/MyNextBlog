using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 分类管理服务
/// 负责文章分类的增删改查
/// </summary>
public class CategoryService(AppDbContext context) : ICategoryService
{
    /// <summary>
    /// 获取所有分类
    /// </summary>
    public async Task<List<Category>> GetAllCategoriesAsync()
    {
        // 按名称字母顺序排序返回
        return await context.Categories.OrderBy(c => c.Name).ToListAsync();
    }

    /// <summary>
    /// 根据 ID 获取分类
    /// </summary>
    public async Task<Category?> GetByIdAsync(int id)
    {
        return await context.Categories.FindAsync(id);
    }

    /// <summary>
    /// 创建新分类
    /// </summary>
    public async Task<Category> AddCategoryAsync(string name)
    {
        // 创建实体并清理输入
        var category = new Category { Name = name.Trim() };
        
        // 标记为添加状态
        context.Categories.Add(category);
        
        // 提交到数据库
        await context.SaveChangesAsync();
        return category;
    }

    /// <summary>
    /// 检查分类名称是否存在 (不区分大小写)
    /// </summary>
    public async Task<bool> ExistsAsync(string name)
    {
        // 使用 ToLower() 进行忽略大小写的比较
        return await context.Categories.AnyAsync(c => c.Name.ToLower() == name.Trim().ToLower());
    }
}
