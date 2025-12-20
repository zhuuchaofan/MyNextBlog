using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 画廊控制器
/// 提供类似 Pinterest 的图片流浏览功能
/// </summary>
[Route("api/gallery")]
[ApiController]
public class GalleryController(IGalleryService galleryService) : ControllerBase
{
    /// <summary>
    /// 获取公开文章中的图片列表
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetImages(int page = 1, int pageSize = 20, string? keyword = null)
    {
        var result = await galleryService.GetImagesAsync(page, pageSize, keyword);
        return Ok(result);
    }
}
