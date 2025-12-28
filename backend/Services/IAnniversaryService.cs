// Services/IAnniversaryService.cs
// 纪念日服务接口定义

using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 纪念日服务接口，提供 CRUD 操作和公开查询
/// </summary>
public interface IAnniversaryService
{
    /// <summary>
    /// 获取所有启用的纪念日（公开 API 使用）
    /// </summary>
    Task<List<AnniversaryDto>> GetActiveAnniversariesAsync();
    
    /// <summary>
    /// 获取所有纪念日，包括禁用的（管理后台使用）
    /// </summary>
    Task<List<AnniversaryAdminDto>> GetAllAnniversariesAsync();
    
    /// <summary>
    /// 根据 ID 获取单个纪念日
    /// </summary>
    Task<Anniversary?> GetByIdAsync(int id);
    
    /// <summary>
    /// 创建新纪念日
    /// </summary>
    Task<Anniversary> CreateAsync(CreateAnniversaryDto dto);
    
    /// <summary>
    /// 更新纪念日
    /// </summary>
    Task<Anniversary?> UpdateAsync(int id, UpdateAnniversaryDto dto);
    
    /// <summary>
    /// 删除纪念日
    /// </summary>
    Task<bool> DeleteAsync(int id);
}
