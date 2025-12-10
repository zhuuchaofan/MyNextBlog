using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;

namespace MyNextBlog.Controllers.Api;

[Route("api/gallery")]
[ApiController]
public class GalleryController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetImages(int page = 1, int pageSize = 20, string? keyword = null)
    {
        var query = context.ImageAssets
            .Include(i => i.Post)
            .ThenInclude(p => p.Category)
            .Include(i => i.Post)
            .ThenInclude(p => p.Tags)
            .Where(i => i.Post != null && !i.Post.IsHidden); // 必须关联了公开文章

        // 如果有搜索关键词，则筛选分类或标签
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(i => 
                (i.Post.Category != null && i.Post.Category.Name.Contains(keyword)) ||
                i.Post.Tags.Any(t => t.Name.Contains(keyword))
            );
        }

        query = query.OrderByDescending(i => i.UploadTime);

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
