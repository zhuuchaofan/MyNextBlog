using Microsoft.AspNetCore.Mvc;
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
        var user = await authService.AuthenticateAsync(dto.Username, dto.Password);
        if (user == null)
        {
            return Unauthorized(new { message = "用户名或密码错误" });
        }

        // 生成 Token
        var token = authService.GenerateJwtToken(user);
        
        // 返回 Token 和用户信息
        return Ok(new 
        {
            token,
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
    /// 用户注册
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var result = await authService.RegisterAsync(dto.Username, dto.Password);

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

    public record LoginDto(string Username, string Password);
    public record RegisterDto(string Username, string Password);
}
