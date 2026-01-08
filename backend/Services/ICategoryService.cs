// ============================================================================
// Services/ICategoryService.cs - 分类服务接口
// ============================================================================
// 此接口定义了分类模块的业务契约。
//
// **架构修复 (2026-01-01)**: 返回 DTO 而非 Entity，防止数据泄露

using MyNextBlog.DTOs;  // 数据传输对象

namespace MyNextBlog.Services;

/// <summary>
/// 分类服务接口
/// </summary>
public interface ICategoryService
{
    /// <summary>
    /// 获取所有分类
    /// </summary>
    Task<List<CategoryDto>> GetAllCategoriesAsync();
    
    /// <summary>
    /// 根据 ID 获取分类
    /// </summary>
    Task<CategoryDto?> GetByIdAsync(int id);
    
    /// <summary>
    /// 创建新分类
    /// </summary>
    Task<CategoryDto> AddCategoryAsync(string name);
    
    /// <summary>
    /// 检查分类名称是否存在
    /// </summary>
    Task<bool> ExistsAsync(string name);

    /// <summary>
    /// 更新分类名称
    /// </summary>
    Task<CategoryDto?> UpdateAsync(int id, string name);

    /// <summary>
    /// 删除分类（如果分类下没有文章）
    /// </summary>
    Task<(bool Success, string? Error)> DeleteAsync(int id);
}