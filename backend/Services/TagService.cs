using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public class TagService(AppDbContext context) : ITagService
{
    public async Task<List<Tag>> GetPopularTagsAsync(int count)
    {
        // 仅统计未隐藏的文章
        return await context.Tags
            .Select(t => new 
            { 
                Tag = t, 
                VisiblePostCount = t.Posts.Count(p => !p.IsHidden) 
            })
            .Where(x => x.VisiblePostCount > 0)
            .OrderByDescending(x => x.VisiblePostCount)
            .Take(count)
            .Select(x => x.Tag)
            .ToListAsync();
    }

    public async Task<List<Tag>> GetOrCreateTagsAsync(string[] tagNames)
    {
        var tags = new List<Tag>();
        foreach (var name in tagNames.Distinct())
        {
            var cleanName = name.Trim();
            if (string.IsNullOrWhiteSpace(cleanName)) continue;

            var tag = await context.Tags.FirstOrDefaultAsync(t => t.Name == cleanName);
            if (tag == null)
            {
                tag = new Tag { Name = cleanName };
                context.Tags.Add(tag);
            }
            tags.Add(tag);
        }
        await context.SaveChangesAsync();
        return tags;
    }
}