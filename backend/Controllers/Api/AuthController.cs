// ============================================================================
// Controllers/Api/AuthController.cs - 认证 API 控制器
// ============================================================================
// 此控制器处理用户认证相关的 HTTP 请求。
//
// **功能**:
//   - 登录/注册
//   - Token 刷新
//   - 密码重置
//
// **Token 策略**: Access Token (15 分钟) + Refresh Token (7 天)

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Mvc;  // ASP.NET Core MVC
using Microsoft.AspNetCore.RateLimiting;  // Rate Limiting 特性
using MyNextBlog.DTOs;           // 数据传输对象
using MyNextBlog.Services;       // 业务服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `AuthController` 是认证模块的 API 控制器。
/// 
/// **路由**: `/api/auth`
/// **接口**: login, register, refresh-token, forgot-password, reset-password
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// 用户登录
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("login")]  // 频率限制: 每分钟最多 5 次
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        // 使用 Service 提供的 Helper 方法进行认证
        var result = await authService.LoginAsync(dto);
        if (result == null)
        {
            return Unauthorized(new { success = false, message = "用户名或密码错误" });
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
                AvatarUrl = result.AvatarUrl,
                Nickname = result.Nickname,
                Bio = result.Bio,
                Website = result.Website,
                Location = result.Location,
                Occupation = result.Occupation,
                BirthDate = result.BirthDate,
                Email = result.Email
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
             return Unauthorized(new { success = false, message = "无效的令牌" });
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
        var response = await authService.RegisterAsync(dto.Username, dto.Password, dto.Email);
        
        if (response == null)
        {
            return BadRequest(new { success = false, message = "注册失败，用户名或邮箱已存在" });
        }

        // 返回完整的认证信息（包含 RefreshToken）
        return Ok(new { success = true, data = response });
    }

    /// <summary>
    /// 忘记密码
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var result = await authService.ForgotPasswordAsync(dto.Email);
        return Ok(new { success = true, message = result.Message });
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
            return BadRequest(new { success = false, message = result.Message });
        }

        return Ok(new { success = true, message = result.Message });
    }
}