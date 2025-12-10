using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 图片上传与管理控制器
/// 负责处理文章插图的上传，并维护图片与文章的关联状态
/// </summary>
[Route("api/[controller]")]
[ApiController]
// 统一使用 JWT 认证，因为这是管理端或登录用户的操作
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)] 
public class UploadController(IStorageService storageService, IImageService imageService) : ControllerBase
{
    /// <summary>
    /// 上传文章插图
    /// </summary>
    /// <param name="file">图片文件 (jpg, png, gif, webp)</param>
    /// <returns>图片的 URL</returns>
    /// <remarks>
    /// 此时上传的图片 PostId 为 null。
    /// 当用户保存文章时，ImageService 会自动扫描文章内容并将图片关联到文章。
    /// </remarks>
    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        // 1. 检查文件格式 (只允许常见图片格式)
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLower();

        if (!allowedExtensions.Contains(extension))
            return BadRequest("只支持上传图片格式");

        // 2. 上传到 R2 云存储
        // 注意：我们直接传原始文件名，StorageService 内部会负责生成安全的 GUID 文件名
        using var stream = file.OpenReadStream();
        var result = await storageService.UploadAsync(stream, file.FileName, file.ContentType);

        // 3. 在数据库中记录这张图片 (暂时标记为"无主"图片)
        await imageService.RecordImageAsync(result.Url, result.StorageKey);

        // 4. 返回访问链接供前端 Markdown 编辑器插入
        return Ok(new { url = result.Url });
    }

    /// <summary>
    /// 手动触发清理僵尸图片
    /// </summary>
    /// <remarks>
    /// 清理规则：上传超过 24 小时且未被任何文章引用的图片。
    /// 建议作为定时任务调用，或者在管理后台手动调用。
    /// </remarks>
    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup()
    {
        int count = await imageService.CleanupOrphanedImagesAsync();
        return Ok(new { message = $"清理完成，共删除了 {count} 张僵尸图片。" });
    }
}
