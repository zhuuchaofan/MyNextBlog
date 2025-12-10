using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 画廊控制器
/// 提供类似 Pinterest 的图片流浏览功能
/// </summary>
[Route("api/gallery")]
[ApiController]
public class GalleryController(AppDbContext context) : ControllerBase
{
    /// <summary>
    /// 获取公开文章中的图片列表
    /// </summary>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    /// <param name="keyword">筛选关键词 (匹配分类或标签)，若为空则返回所有</param>
    /// <returns>图片列表 (适配前端相册组件的格式)</returns>
    [HttpGet]
    public async Task<IActionResult> GetImages(int page = 1, int pageSize = 20, string? keyword = null)
    {
        // 核心逻辑：只展示"公开文章"中的图片
        // 隐藏文章的图片不应该出现在公共图库中
        var query = context.ImageAssets
            .Include(i => i.Post)
            .ThenInclude(p => p.Category)
            .Include(i => i.Post)
            .ThenInclude(p => p.Tags)
            .Where(i => i.Post != null && !i.Post.IsHidden); 

        // 搜索过滤逻辑
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
                src = i.Url,   // 图片地址
                alt = i.Post.Title, // 图片描述 (使用文章标题)
                width = 800,   // 占位宽度 (前端自适应)
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