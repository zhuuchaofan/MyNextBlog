using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface ICategoryService
{
    Task<List<Category>> GetAllCategoriesAsync();
    Task<Category?> GetByIdAsync(int id);
    Task<Category> AddCategoryAsync(string name);
    Task<bool> ExistsAsync(string name);
}