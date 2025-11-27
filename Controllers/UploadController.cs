using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MyTechBlog.Controllers;

[Authorize(Roles = "Admin")] // 只有管理员能上传图片
[Route("api/[controller]")] // 访问路径是 /api/upload
[ApiController] // 这是一个 API 控制器，不是返回页面的
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public UploadController(IWebHostEnvironment env)
    {
        _env = env; // 获取网站的根目录路径
    }

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

        // 2. 准备保存路径: wwwroot/uploads
        var webRootPath = _env.WebRootPath;
        var uploadPath = Path.Combine(webRootPath, "uploads");

        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath); // 如果文件夹不存在，就创建一个

        // 3. 生成随机文件名 (防止重名覆盖)
        var fileName = Guid.NewGuid().ToString() + extension;
        var filePath = Path.Combine(uploadPath, fileName);

        // 4. 保存文件到硬盘
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // 5. 返回图片的访问 URL
        // 例如: /uploads/abc-123.png
        return Ok(new { url = $"/uploads/{fileName}" });
    }
}