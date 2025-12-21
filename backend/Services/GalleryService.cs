using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

public class GalleryService(AppDbContext context) : IGalleryService
{
    public async Task<GalleryResponseDto> GetImagesAsync(int page, int pageSize, string? keyword)
    {
        // 1. 构建基础查询
        // 核心规则：只展示"公开文章"中的图片。
        // 如果文章被隐藏 (IsHidden=true)，它的图片也不应该在公共图库中显示。
        var query = context.ImageAssets
            .Include(i => i.Post)
            .ThenInclude(p => p!.Category)
            .Include(i => i.Post)
            .ThenInclude(p => p!.Tags)
            .Where(i => i.Post != null && !i.Post.IsHidden); 

        // 2. 应用搜索过滤器 (如果提供了关键词)
        // 允许根据文章的分类名称或标签名称筛选图片
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(i => 
                (i.Post!.Category != null && i.Post.Category.Name.Contains(keyword)) ||
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
            .Select(i => new GalleryImageDto(
                i.Id,
                i.Url,
                i.Post!.Title,
                i.Width > 0 ? i.Width : 800,  // 如果有真实尺寸则使用，否则使用默认值
                i.Height > 0 ? i.Height : 600
            ))
            .ToListAsync();

        // 5. 返回结果
        return new GalleryResponseDto(
            true,
            images,
            new { totalCount, page, pageSize }
        );
    }
}