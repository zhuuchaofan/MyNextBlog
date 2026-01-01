// ============================================================================
// Services/ISiteContentService.cs - 站点内容服务接口
// ============================================================================
// 此接口定义了站点配置内容的业务契约。
//
// **使用场景**:
//   - 关于页面数据聚合
//   - 站点配置读写
//   - 管理员配置管理

// `using` 语句用于导入必要的命名空间
using MyNextBlog.DTOs;  // 数据传输对象

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `ISiteContentService` 定义了站点内容模块的业务逻辑接口。
/// 
/// **职责**: 
///   - 聚合关于页面配置
///   - 读写 SiteContent 键值对
///   - 管理员配置管理
/// </summary>
public interface ISiteContentService
{
    /// <summary>
    /// 获取关于页面所需的所有配置数据
    /// </summary>
    /// <returns>Key-Value 字典</returns>
    Task<Dictionary<string, string>> GetAboutPageDataAsync();
    
    /// <summary>
    /// 获取单个配置（含元数据）
    /// </summary>
    /// <param name="key">配置键</param>
    /// <returns>配置 DTO，不存在则返回 null</returns>
    Task<SiteContentDto?> GetByKeyAsync(string key);
    
    /// <summary>
    /// 获取所有配置（管理员接口）
    /// </summary>
    /// <returns>所有配置 DTO 列表</returns>
    Task<List<SiteContentDto>> GetAllAsync();
    
    /// <summary>
    /// 更新或创建配置（Upsert）
    /// </summary>
    /// <param name="key">配置键</param>
    /// <param name="value">配置值</param>
    /// <param name="description">可选描述</param>
    /// <returns>更新后的配置 DTO</returns>
    Task<SiteContentDto> UpsertAsync(string key, string value, string? description);
}
