// ============================================================================
// Services/CategoryService.cs - 分类服务实现
// ============================================================================
// 此服务负责文章分类的管理。
//
// **架构修复 (2026-01-01)**: 返回 DTO 而非 Entity，防止数据泄露

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;  // EF Core
using MyNextBlog.Data;                // 数据访问层
using MyNextBlog.DTOs;                // 数据传输对象
using MyNextBlog.Models;              // 领域模型

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `CategoryService` 是分类模块的服务类，实现 `ICategoryService` 接口。
/// 
/// **主要功能**: 分类的增删改查，名称去重检查
/// </summary>
public class CategoryService(AppDbContext context) : ICategoryService
{
    /// <summary>
    /// 获取所有分类（包含关联文章数）
    /// </summary>
    public async Task<List<CategoryDto>> GetAllCategoriesAsync()
    {
        // 使用 Projection 直接映射到 DTO，并统计公开和隐藏文章数量
        return await context.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(
                c.Id, 
                c.Name,
                c.Posts.Count(p => !p.IsHidden && !p.IsDeleted),  // 公开文章数
                c.Posts.Count(p => p.IsHidden && !p.IsDeleted)    // 隐藏文章数
            ))
            .ToListAsync();
    }

    /// <summary>
    /// 根据 ID 获取分类
    /// </summary>
    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        return await context.Categories
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoryDto(
                c.Id, 
                c.Name,
                c.Posts.Count(p => !p.IsHidden && !p.IsDeleted),  // 公开文章数
                c.Posts.Count(p => p.IsHidden && !p.IsDeleted)    // 隐藏文章数
            ))
            .FirstOrDefaultAsync();
    }

    /// <summary>
    /// 创建新分类
    /// </summary>
    public async Task<CategoryDto> AddCategoryAsync(string name)
    {
        // 创建实体并清理输入
        var category = new Category { Name = name.Trim() };
        
        // 标记为添加状态
        context.Categories.Add(category);
        
        // 提交到数据库
        await context.SaveChangesAsync();
        
        // 返回 DTO
        return new CategoryDto(category.Id, category.Name);
    }

    /// <summary>
    /// 检查分类名称是否存在 (不区分大小写)
    /// </summary>
    public async Task<bool> ExistsAsync(string name)
    {
        // 使用 ToLower() 进行忽略大小写的比较
        return await context.Categories.AnyAsync(c => c.Name.ToLower() == name.Trim().ToLower());
    }

    /// <summary>
    /// 更新分类名称
    /// </summary>
    public async Task<CategoryDto?> UpdateAsync(int id, string name)
    {
        var category = await context.Categories.FindAsync(id);
        if (category == null) return null;

        category.Name = name.Trim();
        await context.SaveChangesAsync();

        return new CategoryDto(category.Id, category.Name);
    }

    /// <summary>
    /// 删除分类
    /// </summary>
    /// <returns>如果分类下有文章，返回 false；否则删除并返回 true</returns>
    public async Task<(bool Success, string? Error)> DeleteAsync(int id)
    {
        var category = await context.Categories
            .Include(c => c.Posts)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return (false, "分类不存在");

        // 检查是否有关联的文章
        if (category.Posts.Any())
            return (false, "该分类下还有文章，无法删除");

        context.Categories.Remove(category);
        await context.SaveChangesAsync();

        return (true, null);
    }
}
