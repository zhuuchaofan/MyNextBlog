using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 标签管理服务
/// 负责标签的统计、查询和去重创建
/// </summary>
public class TagService(AppDbContext context) : ITagService
{
    /// <summary>
    /// 获取热门标签列表
    /// </summary>
    /// <param name="count">返回的标签数量</param>
    /// <returns>按关联文章数量（仅限公开文章）倒序排列的标签列表</returns>
    public async Task<List<Tag>> GetPopularTagsAsync(int count)
    {
        // 核心逻辑：我们只关心那些关联了"公开文章"的标签。
        // 如果一个标签只关联了隐藏文章，它不应该出现在热门列表中。
        return await context.Tags
            .Select(t => new 
            { 
                Tag = t, 
                // 计算该标签下 visible (IsHidden=false) 文章的数量
                VisiblePostCount = t.Posts.Count(p => !p.IsHidden) 
            })
            .Where(x => x.VisiblePostCount > 0) // 过滤掉没有公开文章的标签
            .OrderByDescending(x => x.VisiblePostCount) // 按热度排序
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
