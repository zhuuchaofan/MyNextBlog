using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;
using MyNextBlog.Data; // Added
using MyNextBlog.Models; // Added
using Microsoft.EntityFrameworkCore; // Added for AnyAsync

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 认证控制器 (用户登录、注册等)
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class AuthController(IAuthService authService, AppDbContext context) : ControllerBase
{
    /// <summary>
    /// 用户登录
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await authService.AuthenticateAsync(dto.Username, dto.Password);
        if (user == null)
        {
            return Unauthorized(new { message = "用户名或密码错误" });
        }

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
        if (await context.Users.AnyAsync(u => u.Username == dto.Username))
        {
            return BadRequest(new { message = "用户名已存在" });
        }

        // 创建新用户 (默认普通用户角色)
        var user = new User
        {
            Username = dto.Username,
            Role = "User", // 默认角色
            AvatarUrl = null
        };
        
        // 哈希密码 (简单示例，实际应使用更强的哈希算法如 BCrypt/Argon2)
        // 注意：AuthService.AuthenticateAsync 使用的是安全的 BCrypt 哈希
        user.PasswordHash = authService.HashPassword(dto.Password);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        // 注册成功后直接生成 Token 登录
        var token = authService.GenerateJwtToken(user);

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

    public record LoginDto(string Username, string Password);
    public record RegisterDto(string Username, string Password);
}