using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;

namespace MyNextBlog.Controllers.Api;

[Route("api/gallery")]
[ApiController]
public class GalleryController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetImages(int page = 1, int pageSize = 20)
    {
        var query = context.ImageAssets
            .Include(i => i.Post)
            .ThenInclude(p => p.Category)
            .Include(i => i.Post)
            .ThenInclude(p => p.Tags)
            .Where(i => i.Post != null && !i.Post.IsHidden) // 必须关联了公开文章
            .Where(i => 
                // 分类匹配
                (i.Post.Category != null && (i.Post.Category.Name.Contains("猫"))) ||
                // 标签匹配
                i.Post.Tags.Any(t => t.Name.Contains("猫") || t.Name.Contains("Cat"))
            )
            .OrderByDescending(i => i.UploadTime);

        var totalCount = await query.CountAsync();
        var images = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new 
            {
                i.Id,
                src = i.Url, // 前端库通常用 src
                alt = i.Post.Title,
                width = 800, // 假数据，为了兼容某些库，实际显示自适应
                height = 600
            })
            .ToListAsync();

        return Ok(new 
        { 
            success = true, 
            data = images,
            meta = new { totalCount, page, pageSize }
        });
    }
}
