using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

public interface IGalleryService
{
    Task<GalleryResponseDto> GetImagesAsync(int page, int pageSize, string? keyword);
}
