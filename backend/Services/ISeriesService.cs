using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface ISeriesService
{
    Task<List<SeriesDto>> GetAllSeriesAsync();
    Task<SeriesDto?> GetSeriesByIdAsync(int id);
    Task<Series> CreateSeriesAsync(CreateSeriesDto dto);
    Task<Series> UpdateSeriesAsync(int id, UpdateSeriesDto dto);
    Task DeleteSeriesAsync(int id);
}
