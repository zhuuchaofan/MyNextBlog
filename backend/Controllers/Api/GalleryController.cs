// ============================================================================
// Controllers/Api/GalleryController.cs - 图库 API 控制器
// ============================================================================
// 此控制器提供图片流浏览功能，类似 Pinterest 风格。
//
// **用途**: 猫咪相册页面 (传入 keyword=猫咪)
// **数据源**: 公开文章中嵌入的图片

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Mvc;  // ASP.NET Core MVC
using MyNextBlog.Services;       // 业务服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `GalleryController` 是图库模块的 API 控制器。
/// 
/// **路由**: `/api/gallery`
/// **公开接口**: GET (支持 keyword 筛选)
/// </summary>
[Route("api/gallery")]
[ApiController]
public class GalleryController(IGalleryService galleryService) : ControllerBase
{
    /// <summary>
    /// 获取公开文章中的图片列表
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetImages(int page = 1, int pageSize = 20, string? keyword = null)
    {
        var result = await galleryService.GetImagesAsync(page, pageSize, keyword);
        return Ok(result);
    }
}
