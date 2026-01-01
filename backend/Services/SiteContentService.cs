// ============================================================================
// Services/SiteContentService.cs - 站点内容服务实现
// ============================================================================
// 此服务负责站点配置内容的读写。
//
// **架构修复**: 将 DbContext 直接访问从 Controller 层移到 Service 层，
//              遵循 Clean Architecture (Thin Controllers)

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;  // EF Core 数据库操作
using MyNextBlog.Data;                // 数据访问层
using MyNextBlog.DTOs;                // 数据传输对象
using MyNextBlog.Models;              // 领域模型

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `SiteContentService` 是站点内容模块的服务类，实现 `ISiteContentService` 接口。
/// 
/// **主要功能**:
///   - `GetAboutPageDataAsync`: 获取关于页面配置（聚合 9 个 Key）
///   - `GetByKeyAsync` / `GetAllAsync`: 配置读取
///   - `UpsertAsync`: 配置更新或创建
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
    /// 获取单个配置（含元数据）
    /// </summary>
    public async Task<SiteContentDto?> GetByKeyAsync(string key)
    {
        var content = await context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key);
        
        if (content == null) return null;
        
        return new SiteContentDto(content.Key, content.Value, content.Description, content.UpdatedAt);
    }
    
    /// <summary>
    /// 获取所有配置（管理员接口）
    /// </summary>
    public async Task<List<SiteContentDto>> GetAllAsync()
    {
        var contents = await context.SiteContents
            .AsNoTracking()
            .OrderBy(c => c.Key)
            .ToListAsync();
        
        return contents.Select(c => new SiteContentDto(c.Key, c.Value, c.Description, c.UpdatedAt)).ToList();
    }
    
    /// <summary>
    /// 更新或创建配置（Upsert）
    /// </summary>
    public async Task<SiteContentDto> UpsertAsync(string key, string value, string? description)
    {
        var content = await context.SiteContents.FirstOrDefaultAsync(c => c.Key == key);

        if (content == null)
        {
            // 不存在则创建
            content = new SiteContent
            {
                Key = key,
                Value = value,
                Description = description,
                UpdatedAt = DateTime.UtcNow
            };
            context.SiteContents.Add(content);
        }
        else
        {
            // 存在则更新
            content.Value = value;
            if (description != null)
            {
                content.Description = description;
            }
            content.UpdatedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync();
        
        return new SiteContentDto(content.Key, content.Value, content.Description, content.UpdatedAt);
    }
    
    /// <summary>
    /// 批量获取指定 Key 的配置（用于首页聚合）
    /// </summary>
    public async Task<Dictionary<string, string>> GetByKeysAsync(string[] keys)
    {
        var contents = await context.SiteContents
            .AsNoTracking()
            .Where(c => keys.Contains(c.Key))
            .Select(c => new { c.Key, c.Value })
            .ToListAsync();

        return contents.ToDictionary(c => c.Key, c => c.Value);
    }
    
    /// <summary>
    /// 批量更新配置
    /// </summary>
    public async Task<int> BatchUpdateAsync(List<(string Key, string Value)> updates)
    {
        var keys = updates.Select(u => u.Key).ToList();
        var contents = await context.SiteContents
            .Where(c => keys.Contains(c.Key))
            .ToListAsync();

        var updateTime = DateTime.UtcNow;
        foreach (var (key, value) in updates)
        {
            var content = contents.FirstOrDefault(c => c.Key == key);
            if (content != null)
            {
                content.Value = value;
                content.UpdatedAt = updateTime;
            }
        }

        await context.SaveChangesAsync();
        return contents.Count;
    }
    
    /// <summary>
    /// 更新单个配置值（仅更新值，不创建）
    /// </summary>
    public async Task<SiteContentDto?> UpdateValueAsync(string key, string value)
    {
        var content = await context.SiteContents.FirstOrDefaultAsync(c => c.Key == key);
        
        if (content == null) return null;
        
        content.Value = value;
        content.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        
        return new SiteContentDto(content.Key, content.Value, content.Description, content.UpdatedAt);
    }
}
