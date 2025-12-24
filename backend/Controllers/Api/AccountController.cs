using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Extensions;
using MyNextBlog.Services;

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
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var user = await userService.GetUserByIdAsync(userId.Value);
        if (user == null) return NotFound("User not found");

        return Ok(UserDto.FromEntity(user));
    }

    /// <summary>
    /// 更新个人资料
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var result = await userService.UpdateProfileAsync(userId.Value, dto);
        
        if (!result.Success)
        {
             return BadRequest(new { success = false, message = result.Message });
        }

        return Ok(new { success = true, user = UserDto.FromEntity(result.User!) });
    }

    /// <summary>
    /// 上传并更新用户头像
    /// </summary>
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar(IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("请选择文件");

        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        await using var stream = file.OpenReadStream();
        var result = await userService.UpdateAvatarAsync(userId.Value, stream, file.FileName, file.ContentType, file.Length);

        if (!result.Success)
        {
            return BadRequest(new { success = false, message = result.Message });
        }

        return Ok(new { success = true, avatarUrl = result.User?.AvatarUrl });
    }
}
