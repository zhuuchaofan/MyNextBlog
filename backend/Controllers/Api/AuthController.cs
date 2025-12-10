using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 认证控制器 (公开)
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// 用户登录接口
    /// </summary>
    /// <param name="dto">包含 Username 和 Password 的对象</param>
    /// <returns>若成功返回 JWT Token，失败则返回 401</returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var authResponse = await authService.LoginAsync(dto);

        if (authResponse == null)
        {
            return Unauthorized(new { message = "用户名或密码错误" });
        }

        return Ok(authResponse);
    }
}
