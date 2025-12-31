// ============================================================================
// Services/SeriesService.cs - 文章系列服务实现
// ============================================================================
// 此服务负责文章系列的管理，用于组织相关文章。

// `using` 语句用于导入必要的命名空间
using Microsoft.EntityFrameworkCore;  // EF Core
using MyNextBlog.Data;                // 数据访问层
using MyNextBlog.DTOs;                // 数据传输对象
using MyNextBlog.Models;              // 领域模型

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `SeriesService` 是文章系列模块的服务类，实现 `ISeriesService` 接口。
/// 
/// **主要功能**: 系列 CRUD，获取系列文章列表，自动排序
/// </summary>
public class SeriesService(AppDbContext context) : ISeriesService
{
    public async Task<List<SeriesDto>> GetAllSeriesAsync(bool includeHidden = false)
    {
        return await context.Series
            .AsNoTracking()
            .Select(s => new SeriesDto(
                s.Id,
                s.Name,
                s.Description,
                // 根据权限过滤隐藏文章
                includeHidden ? s.Posts.Count : s.Posts.Count(p => !p.IsHidden)
            ))
            .ToListAsync();
    }

    public async Task<SeriesDto?> GetSeriesByIdAsync(int id, bool includeHidden = false)
    {
        var series = await context.Series
            .AsNoTracking()
            .Include(s => s.Posts)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (series == null) return null;

        // 根据权限过滤隐藏文章
        var postCount = includeHidden 
            ? series.Posts.Count 
            : series.Posts.Count(p => !p.IsHidden);

        return new SeriesDto(
            series.Id,
            series.Name,
            series.Description,
            postCount
        );
    }

    public async Task<List<PostSummaryDto>> GetSeriesPostsAsync(int seriesId, bool includeHidden = false)
    {
        var query = context.Posts
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.User)
            .Include(p => p.Tags)
            .Include(p => p.Series)
            .Where(p => p.SeriesId == seriesId);

        // 非管理员只能看公开文章
        if (!includeHidden)
        {
            query = query.Where(p => !p.IsHidden);
        }

        var posts = await query
            .OrderBy(p => p.SeriesOrder)
            .ThenBy(p => p.CreateTime)
            .ToListAsync();

        return posts.Select(p => new PostSummaryDto(
            p.Id,
            p.Title,
            GetExcerpt(p.Content),
            p.Category?.Name ?? "未分类",
            p.CategoryId,
            p.User?.Username ?? "未知作者",
            p.User?.AvatarUrl,
            p.CreateTime,
            p.UpdatedAt,
            GetCoverImage(p.Content),
            p.Tags.Select(t => t.Name).ToList(),
            p.IsHidden,
            p.LikeCount,
            p.Series?.Name,
            p.SeriesOrder
        )).ToList();
    }

    // Helper: 提取摘要
    private static string GetExcerpt(string content, int length = 200)
    {
        if (string.IsNullOrEmpty(content)) return "";
        var plainText = System.Text.RegularExpressions.Regex.Replace(content, "<.*?>", "");
        plainText = System.Text.RegularExpressions.Regex.Replace(plainText, @"!\[.*?\]\(.*?\)", "");
        plainText = System.Text.RegularExpressions.Regex.Replace(plainText, @"\[.*?\]\(.*?\)", "");
        plainText = System.Text.RegularExpressions.Regex.Replace(plainText, @"[#*`>~\-]", "");
        return plainText.Length > length ? plainText[..length] + "..." : plainText;
    }

    // Helper: 提取封面图
    private static string? GetCoverImage(string content)
    {
        if (string.IsNullOrEmpty(content)) return null;
        var match = System.Text.RegularExpressions.Regex.Match(content, @"!\[.*?\]\((.*?)\)");
        return match.Success ? match.Groups[1].Value : null;
    }

    public async Task<SeriesDto> CreateSeriesAsync(CreateSeriesDto dto)
    {
        var series = new Series
        {
            Name = dto.Name,
            Description = dto.Description
        };

        context.Series.Add(series);
        await context.SaveChangesAsync();

        return new SeriesDto(series.Id, series.Name, series.Description, 0);
    }

    public async Task<SeriesDto> UpdateSeriesAsync(int id, UpdateSeriesDto dto)
    {
        var series = await context.Series.FindAsync(id);
        if (series == null) throw new ArgumentException("Series not found");

        series.Name = dto.Name;
        series.Description = dto.Description;

        await context.SaveChangesAsync();
        
        // Count posts to return correct DTO? Optimally yes, but 0 or current count is fine for update response.
        // Let's quickly count or just return what we have. 
        // For Update response in admin, we might not show count immediately or list relies on GetAll.
        // Let's fetch count to be safe/correct.
        var count = await context.Posts.CountAsync(p => p.SeriesId == id);

        return new SeriesDto(series.Id, series.Name, series.Description, count);
    }

    public async Task DeleteSeriesAsync(int id)
    {
        var series = await context.Series.FindAsync(id);
        if (series != null)
        {
            context.Series.Remove(series);
            await context.SaveChangesAsync();
        }
    }

    public async Task<int> GetNextOrderAsync(int seriesId)
    {
        // Find the maximum SeriesOrder for this series
        var maxOrder = await context.Posts
            .Where(p => p.SeriesId == seriesId)
            .MaxAsync(p => (int?)p.SeriesOrder); // Cast to nullable int to handle no posts case

        return (maxOrder ?? 0) + 1;
    }
}
