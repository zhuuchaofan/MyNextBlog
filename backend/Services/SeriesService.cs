using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public class SeriesService(AppDbContext context) : ISeriesService
{
    public async Task<List<SeriesDto>> GetAllSeriesAsync()
    {
        return await context.Series
            .AsNoTracking()
            .Select(s => new SeriesDto(
                s.Id,
                s.Name,
                s.Description,
                s.Posts.Count
            ))
            .ToListAsync();
    }

    public async Task<SeriesDto?> GetSeriesByIdAsync(int id)
    {
        var series = await context.Series
            .AsNoTracking()
            .Include(s => s.Posts)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (series == null) return null;

        return new SeriesDto(
            series.Id,
            series.Name,
            series.Description,
            series.Posts.Count
        );
    }

    public async Task<Series> CreateSeriesAsync(CreateSeriesDto dto)
    {
        var series = new Series
        {
            Name = dto.Name,
            Description = dto.Description
        };

        context.Series.Add(series);
        await context.SaveChangesAsync();
        return series;
    }

    public async Task<Series> UpdateSeriesAsync(int id, UpdateSeriesDto dto)
    {
        var series = await context.Series.FindAsync(id);
        if (series == null) throw new ArgumentException("系列不存在");

        series.Name = dto.Name;
        series.Description = dto.Description;

        await context.SaveChangesAsync();
        return series;
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
}
