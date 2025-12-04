using MyTechBlog.Models;

namespace MyTechBlog.Services;

public interface ICategoryService
{
    Task<List<Category>> GetAllCategoriesAsync();
    Task<Category> AddCategoryAsync(string name);
    Task<bool> ExistsAsync(string name);
}