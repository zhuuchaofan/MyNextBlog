using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models; // For User model
using BCrypt.Net; // For BCrypt.Net.BCrypt.Verify

namespace MyNextBlog.Services;

/// <summary>
/// 身份认证服务
/// 负责处理用户的登录验证和 JWT 令牌签发
/// </summary>
public class AuthService(AppDbContext context, IConfiguration configuration) : IAuthService
{
    /// <summary>
    /// 处理用户登录请求
    /// </summary>
    /// <param name="dto">包含用户名和密码的数据传输对象</param>
    /// <returns>若登录成功返回包含 Token 的 AuthResponseDto；若失败返回 null</returns>
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        // 1. 查找用户并验证密码
        // 使用 BCrypt 进行哈希对比，确保数据库中的密码哈希值无法被逆向破解
        var user = await context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return null; // 用户名不存在或密码错误
        }

        // 2. 构建 Claims (用户身份声明)
        // 这些信息会被加密存入 JWT Token 中，前端和后端 API 可以直接从 Token 中读取，无需再次查库
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),       // 用户名
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // 用户ID
            new Claim(ClaimTypes.Role, user.Role)            // 角色 (Admin/User)
        };

        // 3. 准备签名密钥
        // 从配置文件中读取 SecretKey，该密钥必须严格保密，否则任何人都能伪造 Token
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        
        if (string.IsNullOrEmpty(secretKey))
        {
            // 防御性编程：如果密钥没配，直接报错，防止系统裸奔
            throw new InvalidOperationException("Server configuration error: Missing JWT Key");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 4. 签发 JWT Token
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7), // Token 有效期 7 天 (使用 UTC 标准时间，避免跨时区问题)
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        // 返回结果
        return new AuthResponseDto(
            Token: tokenString,
            Expiration: token.ValidTo,
            Username: user.Username,
            Role: user.Role
        );
    }
}