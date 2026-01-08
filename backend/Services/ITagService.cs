// ============================================================================
// Services/ITagService.cs - 标签服务接口
// ============================================================================
// 此接口定义了标签模块的业务契约。

using MyNextBlog.DTOs;   // 数据传输对象
using MyNextBlog.Models; // 领域模型

namespace MyNextBlog.Services;

/// <summary>
/// 标签服务接口
/// </summary>
public interface ITagService
{
    /// <summary>
    /// 获取热门标签（按使用次数排序）
    /// </summary>
    Task<List<Tag>> GetPopularTagsAsync(int count, bool includeHidden = false);

    /// <summary>
    /// 获取或创建标签（批量处理）
    /// </summary>
    Task<List<Tag>> GetOrCreateTagsAsync(string[] tagNames);

    /// <summary>
    /// 获取所有标签（包含使用次数）
    /// </summary>
    Task<List<TagDto>> GetAllTagsAsync();

    /// <summary>
    /// 根据 ID 获取标签
    /// </summary>
    Task<TagDto?> GetByIdAsync(int id);

    /// <summary>
    /// 创建新标签
    /// </summary>
    Task<TagDto> AddTagAsync(string name);

    /// <summary>
    /// 检查标签名称是否存在
    /// </summary>
    Task<bool> ExistsAsync(string name);

    /// <summary>
    /// 更新标签名称
    /// </summary>
    Task<TagDto?> UpdateAsync(int id, string name);

    /// <summary>
    /// 删除标签（如果标签下没有文章）
    /// </summary>
    Task<(bool Success, string? Error)> DeleteAsync(int id);
}