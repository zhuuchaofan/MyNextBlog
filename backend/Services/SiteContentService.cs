// ============================================================================
// Services/SiteContentService.cs - 站点内容服务实现
// ============================================================================
// 此服务负责站点配置内容的读写，原逻辑从 AboutController 迁移而来。
//
// **架构修复**: 将 DbContext 直接访问从 Controller 层移到 Service 层，
//              遵循 Clean Architecture (Thin Controllers)

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;  // EF Core 数据库操作
using MyNextBlog.Data;                // 数据访问层

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `SiteContentService` 是站点内容模块的服务类，实现 `ISiteContentService` 接口。
/// 
/// **主要功能**:
///   - `GetAboutPageDataAsync`: 获取关于页面配置（聚合 9 个 Key）
///   - `GetValueAsync` / `UpdateValueAsync`: 通用的配置读写
/// 
/// **重构来源**:
///   - 原 `AboutController.GetInitialData()` → `GetAboutPageDataAsync`
/// </summary>
public class SiteContentService(AppDbContext context) : ISiteContentService
{
    // 关于页面所需的配置 Key 列表
    private static readonly string[] AboutKeys =
    [
        "about_intro",
        "about_author",
        "about_skills",
        "about_timeline",
        "about_books",
        "about_gears",
        "about_pets",
        "about_thanks_title",
        "about_thanks_content"
    ];
    
    /// <summary>
    /// 获取关于页面所需的所有配置数据
    /// </summary>
    /// <remarks>
    /// 批量查询优化：一次 SQL 查询获取所有 Key，避免 N 次请求
    /// </remarks>
    public async Task<Dictionary<string, string>> GetAboutPageDataAsync()
    {
        var contents = await context.SiteContents
            .AsNoTracking()
            .Where(c => AboutKeys.Contains(c.Key))
            .Select(c => new { c.Key, c.Value })
            .ToListAsync();

        return contents.ToDictionary(c => c.Key, c => c.Value);
    }
    
    /// <summary>
    /// 获取单个配置值
    /// </summary>
    public async Task<string?> GetValueAsync(string key)
    {
        var content = await context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key);
        
        return content?.Value;
    }
    
    /// <summary>
    /// 更新配置值
    /// </summary>
    public async Task<bool> UpdateValueAsync(string key, string value)
    {
        var content = await context.SiteContents.FirstOrDefaultAsync(c => c.Key == key);
        
        if (content == null) return false;
        
        content.Value = value;
        content.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        
        return true;
    }
}
