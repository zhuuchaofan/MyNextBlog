using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface ISeriesService
{
    Task<List<SeriesDto>> GetAllSeriesAsync();
    Task<SeriesDto?> GetSeriesByIdAsync(int id);
    Task<SeriesDto> CreateSeriesAsync(CreateSeriesDto dto);
    Task<SeriesDto> UpdateSeriesAsync(int id, UpdateSeriesDto dto);
    Task DeleteSeriesAsync(int id);
    Task<int> GetNextOrderAsync(int seriesId);
}
