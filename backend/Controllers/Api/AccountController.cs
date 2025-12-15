using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;
using System.Security.Claims;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 账户与个人信息控制器
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)]
public class AccountController(IUserService userService) : ControllerBase
{
    /// <summary>
    /// 获取当前登录用户的详细信息
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var user = await userService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound("User not found");
        }

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Role,
            user.AvatarUrl,
            user.Email,
            user.Nickname,
            user.Bio,
            user.Website
        });
    }

    /// <summary>
    /// 更新个人资料
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        var result = await userService.UpdateProfileAsync(userId, dto.Email, dto.Nickname, dto.Bio, dto.Website);
        
        if (!result.Success)
        {
             return BadRequest(new { success = false, message = result.Message });
        }

        var user = result.User!;
        return Ok(new 
        { 
            success = true, 
            user = new { user.Id, user.Username, user.Role, user.AvatarUrl, user.Email, user.Nickname, user.Bio, user.Website } 
        });
    }

    public record UpdateProfileDto(string? Email, string? Nickname, string? Bio, string? Website);

    /// <summary>
    /// 上传并更新用户头像
    /// </summary>
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
        {
            return Unauthorized();
        }

        await using var stream = file.OpenReadStream();
        var result = await userService.UpdateAvatarAsync(userId, stream, file.FileName, file.ContentType, file.Length);

        if (!result.Success)
        {
            return BadRequest(new { success = false, message = result.Message });
        }

        return Ok(new { success = true, avatarUrl = result.User?.AvatarUrl });
    }
}