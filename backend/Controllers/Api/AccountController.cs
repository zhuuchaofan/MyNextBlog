using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Services;
using System.Security.Claims;

namespace MyNextBlog.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)]
public class AccountController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IStorageService _storageService;

    public AccountController(AppDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    // GET: api/account/me
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Role,
            user.AvatarUrl
        });
    }

    // POST: api/account/avatar
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        // 验证文件类型
        if (!file.ContentType.StartsWith("image/"))
            return BadRequest("只能上传图片文件");

        // 限制大小 (例如 5MB)
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("图片大小不能超过 5MB");

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        try
        {
            using var stream = file.OpenReadStream();
            // 上传到 "avatars" 文件夹
            // 注意：fileName 参数传原始文件名即可，R2StorageService 会自动生成 GUID 文件名
            var result = await _storageService.UploadAsync(stream, file.FileName, file.ContentType, "avatars");

            // 更新数据库
            user.AvatarUrl = result.Url;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, avatarUrl = result.Url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"上传失败: {ex.Message}");
        }
    }
}
