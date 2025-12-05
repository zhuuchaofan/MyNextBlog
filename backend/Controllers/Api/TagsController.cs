using Microsoft.AspNetCore.Mvc;
using MyTechBlog.Services;

namespace MyTechBlog.Controllers.Api;

[Route("api/tags")]
[ApiController]
public class TagsController(ITagService tagService) : ControllerBase
{
    [HttpGet("popular")]
    public async Task<IActionResult> GetPopular(int count = 10)
    {
        var tags = await tagService.GetPopularTagsAsync(count);
        return Ok(new { success = true, data = tags.Select(t => t.Name) });
    }
}
