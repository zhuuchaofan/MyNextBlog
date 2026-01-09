// ============================================================================
// Services/IMemoService.cs - Memo 服务接口
// ============================================================================

using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

/// <summary>
/// Memo 服务接口
/// </summary>
public interface IMemoService
{
    /// <summary>
    /// 获取公开的 Memo 列表 (Keyset Pagination)
    /// </summary>
    /// <param name="cursor">游标 (格式: timestamp_id)</param>
    /// <param name="limit">每页数量</param>
    Task<MemoPageResult> GetPublicMemosAsync(string? cursor, int limit = 20);
    
    /// <summary>
    /// 获取所有 Memo (管理员)
    /// </summary>
    Task<List<MemoAdminDto>> GetAllAsync(int page, int pageSize);
    
    /// <summary>
    /// 获取 Memo 总数
    /// </summary>
    Task<int> GetCountAsync(bool includePrivate = false);
    
    /// <summary>
    /// 根据 ID 获取 Memo
    /// </summary>
    Task<MemoAdminDto?> GetByIdAsync(int id);
    
    /// <summary>
    /// 创建 Memo
    /// </summary>
    Task<MemoAdminDto> CreateAsync(CreateMemoDto dto);
    
    /// <summary>
    /// 更新 Memo
    /// </summary>
    Task<MemoAdminDto?> UpdateAsync(int id, UpdateMemoDto dto);
    
    /// <summary>
    /// 删除 Memo
    /// </summary>
    Task<bool> DeleteAsync(int id);
    
    /// <summary>
    /// 获取年度发布热力图数据 (用于前端展示)
    /// </summary>
    /// <param name="year">年份</param>
    Task<Dictionary<string, int>> GetHeatmapDataAsync(int year);
}
