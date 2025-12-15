using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        // 1. 从 JWT Token Claims 中解析用户 ID
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        // 2. 查询数据库获取最新信息
        var user = await context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        // 3. 返回脱敏后的用户信息 (不包含密码哈希)
        return Ok(new
        {
            user.Id,
            user.Username,
            user.Role,
            user.AvatarUrl,
            user.Email // 返回邮箱
        });
    }

    /// <summary>
    /// 更新个人资料 (邮箱)
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        // 1. 获取当前用户
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

        // 2. 更新信息
        if (dto.Email != null)
        {
            // 简单的邮箱格式验证 (可选)
            if (!string.IsNullOrWhiteSpace(dto.Email) && !dto.Email.Contains("@"))
            {
                 return BadRequest(new { success = false, message = "邮箱格式不正确" });
            }
            user.Email = dto.Email;
        }

        await context.SaveChangesAsync();

        return Ok(new 
        { 
            success = true, 
            user = new { user.Id, user.Username, user.Role, user.AvatarUrl, user.Email } 
        });
    }

    public record UpdateProfileDto(string? Email);

    /// <summary>
    /// 上传并更新用户头像
    /// </summary>
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile? file)
    {
        // 1. 基础验证
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        // 2. 安全检查：验证文件类型 (必须是图片)
        if (!file.ContentType.StartsWith("image/"))
            return BadRequest("只能上传图片文件");

        // 3. 大小限制：5MB
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("图片大小不能超过 5MB");

        // 4. 获取当前用户
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
            await using var stream = file.OpenReadStream();
            
            // 5. 上传到云存储
            // 指定 "avatars" 作为前缀，将头像文件单独归档
            var result = await storageService.UploadAsync(stream, file.FileName, file.ContentType, "avatars");

            // 6. 更新用户头像链接
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
