// ============================================================================
// Services/TagService.cs - 标签服务实现
// ============================================================================
// 此服务负责文章标签的管理和统计。

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;  // EF Core
using MyNextBlog.Data;                // 数据访问层
using MyNextBlog.Models;              // 领域模型

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `TagService` 是标签模块的服务类，实现 `ITagService` 接口。
/// 
/// **主要功能**: 热门标签统计，标签去重创建
/// </summary>
public class TagService(AppDbContext context) : ITagService
{
    /// <summary>
    /// 获取热门标签列表
    /// </summary>
    /// <param name="count">返回的标签数量</param>
    /// <param name="includeHidden">是否包含只关联隐藏文章的标签</param>
    /// <returns>按关联文章数量倒序排列的标签列表</returns>
    public async Task<List<Tag>> GetPopularTagsAsync(int count, bool includeHidden = false)
    {
        // `.AsNoTracking()`: 这是一个只读查询，不需要 EF Core 跟踪实体状态，加上此调用以优化性能。
        return await context.Tags.AsNoTracking()
            .Select(t => new 
            { 
                Tag = t, 
                // 如果 includeHidden 为 true，统计所有文章；否则只统计 !IsHidden 的文章
                PostCount = t.Posts.Count(p => includeHidden || !p.IsHidden) 
            })
            .Where(x => x.PostCount > 0) // 过滤掉计数为 0 的标签
            .OrderByDescending(x => x.PostCount) // 按热度排序
            .Take(count)
            .Select(x => x.Tag) // 还原为 Tag 对象
            .ToListAsync();
    }

    /// <summary>
    /// 获取或创建标签 (批量处理)
    /// </summary>
    /// <param name="tagNames">标签名称数组</param>
    /// <returns>处理后的 Tag 实体列表</returns>
    public async Task<List<Tag>> GetOrCreateTagsAsync(string[] tagNames)
    {
        var tags = new List<Tag>();
        
        // 1. 遍历并去重标签名
        foreach (var name in tagNames.Distinct())
        {
            var cleanName = name.Trim();
            if (string.IsNullOrWhiteSpace(cleanName)) continue;

            // 2. 检查数据库中是否已存在同名标签
            var tag = await context.Tags.FirstOrDefaultAsync(t => t.Name == cleanName);
            
            if (tag == null)
            {
                // 3. 不存在则创建新标签
                tag = new Tag { Name = cleanName };
                context.Tags.Add(tag);
            }
            
            // 4. 将现有或新建的标签加入列表
            tags.Add(tag);
        }

        // 5. 统一保存更改 (如果有新建的标签，这里会生成 ID)
        await context.SaveChangesAsync();
        return tags;
    }
}
