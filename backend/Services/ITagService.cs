using MyTechBlog.Models;

namespace MyTechBlog.Services;

public interface ITagService
{
    Task<List<Tag>> GetPopularTagsAsync(int count);
    Task<List<Tag>> GetOrCreateTagsAsync(string[] tagNames);
}