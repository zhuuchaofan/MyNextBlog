using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyTechBlog.Services;

namespace MyTechBlog.Controllers;

[Authorize(Roles = "Admin")] // 只有管理员能上传图片
[Route("api/[controller]")] // 访问路径是 /api/upload
[ApiController] // 这是一个 API 控制器，不是返回页面的
public class UploadController(IStorageService storageService) : ControllerBase
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

        // 2. 生成随机文件名 (防止重名覆盖)
        var fileName = Guid.NewGuid().ToString() + extension;

        // 3. 上传到 R2
        using var stream = file.OpenReadStream();
        var fileUrl = await storageService.UploadAsync(stream, fileName, file.ContentType);

        // 4. 返回图片的访问 URL
        return Ok(new { url = fileUrl });
    }
}