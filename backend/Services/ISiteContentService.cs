// ============================================================================
// Services/ISiteContentService.cs - 站点内容服务接口
// ============================================================================
// 此接口定义了站点配置内容的业务契约。
//
// **使用场景**:
//   - 关于页面数据聚合
//   - 站点配置读写

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `ISiteContentService` 定义了站点内容模块的业务逻辑接口。
/// 
/// **职责**: 
///   - 聚合关于页面配置
///   - 读写 SiteContent 键值对
/// </summary>
public interface ISiteContentService
{
    /// <summary>
    /// 获取关于页面所需的所有配置数据
    /// </summary>
    /// <returns>Key-Value 字典</returns>
    Task<Dictionary<string, string>> GetAboutPageDataAsync();
    
    /// <summary>
    /// 获取单个配置值
    /// </summary>
    /// <param name="key">配置键</param>
    /// <returns>配置值，不存在则返回 null</returns>
    Task<string?> GetValueAsync(string key);
    
    /// <summary>
    /// 更新配置值
    /// </summary>
    /// <param name="key">配置键</param>
    /// <param name="value">新值</param>
    /// <returns>是否更新成功</returns>
    Task<bool> UpdateValueAsync(string key, string value);
}
