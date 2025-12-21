using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 认证控制器 (用户登录、注册等)
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// 用户登录
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        // 使用 Service 提供的 Helper 方法进行认证
        var result = await authService.LoginAsync(dto);
        if (result == null)
        {
            return Unauthorized(new { message = "用户名或密码错误" });
        }
        
        // 返回 Token 和用户信息
        return Ok(new 
        {
            token = result.Token,
            refreshToken = result.RefreshToken,
            user = new 
            {
                Username = result.Username,
                Role = result.Role,
                AvatarUrl = result.AvatarUrl // 现在可以直接返回头像
            }
        });
    }

    /// <summary>
    /// 刷新令牌
    /// </summary>
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
    {
        var result = await authService.RefreshTokenAsync(dto);
        if (result == null)
        {
             return Unauthorized(new { message = "无效的令牌" });
        }

        return Ok(new 
        {
            token = result.Token,
            refreshToken = result.RefreshToken
        });
    }

    /// <summary>
    /// 用户注册
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await authService.RegisterAsync(dto.Username, dto.Password, dto.Email);

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        var user = result.User!;
        return Ok(new 
        {
            token = result.Token,
            user = new 
            {
                user.Id,
                user.Username,
                user.Role,
                user.AvatarUrl 
            }
        });
    }

    /// <summary>
    /// 忘记密码
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var result = await authService.ForgotPasswordAsync(dto.Email);
        return Ok(new { message = result.Message });
    }

    /// <summary>
    /// 重置密码
    /// </summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var result = await authService.ResetPasswordAsync(dto.Email, dto.Token, dto.NewPassword);
        
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }
}