using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
// 统一使用 JWT 认证
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)] 
public class UploadController(IStorageService storageService, IImageService imageService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        // 1. 检查文件格式 (只允许图片)
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLower();

        if (!allowedExtensions.Contains(extension))
            return BadRequest("只支持上传图片格式");

        // 2. 上传到 R2 (由 Service 负责生成安全文件名)
        using var stream = file.OpenReadStream();
        var result = await storageService.UploadAsync(stream, file.FileName, file.ContentType);

        // 3. 在数据库中记录这张图片 (此时 PostId 为 null)
        await imageService.RecordImageAsync(result.Url, result.StorageKey);

        // 4. 返回图片的访问 URL
        return Ok(new { url = result.Url });
    }

    /// <summary>
    /// 手动触发清理僵尸图片 (24小时前的无主图片)
    /// 访问地址: POST /api/upload/cleanup
    /// </summary>
    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup()
    {
        int count = await imageService.CleanupOrphanedImagesAsync();
        return Ok(new { message = $"清理完成，共删除了 {count} 张僵尸图片。" });
    }
}