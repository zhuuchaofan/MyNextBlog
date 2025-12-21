using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface ISeriesService
{
    Task<List<SeriesDto>> GetAllSeriesAsync(bool includeHidden = false);
    Task<SeriesDto?> GetSeriesByIdAsync(int id, bool includeHidden = false);
    Task<List<PostSummaryDto>> GetSeriesPostsAsync(int seriesId, bool includeHidden = false); // 新增：获取系列文章
    Task<SeriesDto> CreateSeriesAsync(CreateSeriesDto dto);
    Task<SeriesDto> UpdateSeriesAsync(int id, UpdateSeriesDto dto);
    Task DeleteSeriesAsync(int id);
    Task<int> GetNextOrderAsync(int seriesId);
}
