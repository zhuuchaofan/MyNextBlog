using Microsoft.EntityFrameworkCore;
using MyTechBlog.Data;
using MyTechBlog.Models;

namespace MyTechBlog.Services;

public class TagService(AppDbContext context) : ITagService
{
    public async Task<List<Tag>> GetPopularTagsAsync(int count)
    {
        return await context.Tags
            .OrderByDescending(t => t.Posts.Count)
            .Take(count)
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