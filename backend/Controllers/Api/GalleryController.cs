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
    [HttpGet]
    public async Task<IActionResult> GetImages(int page = 1, int pageSize = 20, string? keyword = null)
    {
        // 1. 构建基础查询
        // 核心规则：只展示"公开文章"中的图片。
        // 如果文章被隐藏 (IsHidden=true)，它的图片也不应该在公共图库中显示。
        var query = context.ImageAssets
            .Include(i => i.Post)
            .ThenInclude(p => p.Category)
            .Include(i => i.Post)
            .ThenInclude(p => p.Tags)
            .Where(i => i.Post != null && !i.Post.IsHidden); 

        // 2. 应用搜索过滤器 (如果提供了关键词)
        // 允许根据文章的分类名称或标签名称筛选图片
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(i => 
                (i.Post.Category != null && i.Post.Category.Name.Contains(keyword)) ||
                i.Post.Tags.Any(t => t.Name.Contains(keyword))
            );
        }

        // 3. 按上传时间倒序排列 (最新的在前)
        query = query.OrderByDescending(i => i.UploadTime);

        // 4. 执行分页查询
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

        // 5. 返回结果
        return Ok(new 
        { 
            success = true, 
            data = images,
            meta = new { totalCount, page, pageSize }
        });
    }
}
