using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Services;
using System.Security.Claims;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 账户与个人信息控制器
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)]
public class AccountController(AppDbContext context, IStorageService storageService) : ControllerBase
{
    /// <summary>
    /// 获取当前登录用户的详细信息
    /// </summary>
    /// <returns>包含 ID、用户名、角色和头像的 User 对象</returns>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        // 从 JWT Token 中解析用户 ID
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var user = await context.Users.FindAsync(userId);
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

    /// <summary>
    /// 上传并更新用户头像
    /// </summary>
    /// <param name="file">图片文件 (max 5MB)</param>
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        // 1. 验证文件类型 (安全检查)
        if (!file.ContentType.StartsWith("image/"))
            return BadRequest("只能上传图片文件");

        // 2. 验证文件大小 (限制 5MB)
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("图片大小不能超过 5MB");

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var user = await context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        try
        {
            using var stream = file.OpenReadStream();
            
            // 3. 上传到 "avatars" 专用文件夹
            // R2StorageService 会自动处理文件名冲突
            var result = await storageService.UploadAsync(stream, file.FileName, file.ContentType, "avatars");

            // 4. 更新数据库中的头像链接
            user.AvatarUrl = result.Url;
            await context.SaveChangesAsync();

            return Ok(new { success = true, avatarUrl = result.Url });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"上传失败: {ex.Message}");
        }
    }
}