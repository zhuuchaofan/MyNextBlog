using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface ITagService
{
    Task<List<Tag>> GetPopularTagsAsync(int count, bool includeHidden = false);
    Task<List<Tag>> GetOrCreateTagsAsync(string[] tagNames);
}