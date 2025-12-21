using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;
using SixLabors.ImageSharp;

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
    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile? file)
    {
        // 1. 基础参数验证
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        // 2. 检查文件格式 (白名单机制)
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(file.FileName).ToLower();

        if (!allowedExtensions.Contains(extension))
            return BadRequest("只支持上传图片格式");

        // 3. 读取图片尺寸
        int width = 0;
        int height = 0;
        
        await using var stream = file.OpenReadStream();
        try
        {
            // 使用 ImageSharp 只读取图片信息（不解码像素数据，速度快）
            var imageInfo = await Image.IdentifyAsync(stream);
            width = imageInfo.Width;
            height = imageInfo.Height;
        }
        catch
        {
            // 安全修复：如果无法识别图片信息（可能是恶意文件伪装），直接拒绝上传！
            return BadRequest("上传的文件不是有效的图片，或已损坏。");
        }
        
        // 重置流位置，以便后续上传
        stream.Position = 0;

        // 4. 上传到 R2 云存储
        // 注意：我们直接传原始文件名，StorageService 内部会负责生成安全的 GUID 文件名，
        // 防止文件名冲突和路径遍历攻击。
        var result = await storageService.UploadAsync(stream, file.FileName, file.ContentType);

        // 5. 在数据库中记录这张图片
        // 此时图片处于"游离"状态 (PostId = null)，如果在一定时间内未被任何文章引用，
        // 将被后续的清理任务清除。
        await imageService.RecordImageAsync(result.Url, result.StorageKey, width, height);

        // 6. 返回访问链接供前端 Markdown 编辑器插入
        return Ok(new { url = result.Url });
    }

    /// <summary>
    /// 手动触发清理僵尸图片
    /// </summary>
    [HttpPost("cleanup")]
    public async Task<IActionResult> Cleanup()
    {
        // 调用服务执行清理逻辑
        // 这里的"僵尸图片"指：上传超过 24 小时且未被任何文章引用的图片。
        int count = await imageService.CleanupOrphanedImagesAsync();
        return Ok(new { message = $"清理完成，共删除了 {count} 张僵尸图片。" });
    }
}
