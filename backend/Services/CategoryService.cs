using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public class CategoryService(AppDbContext context) : ICategoryService
{
    public async Task<List<Category>> GetAllCategoriesAsync()
    {
        return await context.Categories.OrderBy(c => c.Name).ToListAsync();
    }

    public async Task<Category?> GetByIdAsync(int id)
    {
        return await context.Categories.FindAsync(id);
    }

    public async Task<Category> AddCategoryAsync(string name)
    {
        var category = new Category { Name = name.Trim() };
        context.Categories.Add(category);
        await context.SaveChangesAsync();
        return category;
    }

    public async Task<bool> ExistsAsync(string name)
    {
        return await context.Categories.AnyAsync(c => c.Name.ToLower() == name.Trim().ToLower());
    }
}