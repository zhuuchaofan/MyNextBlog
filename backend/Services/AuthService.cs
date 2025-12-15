// `using` 语句用于导入必要的命名空间。
using System.IdentityModel.Tokens.Jwt; // 引入 JWT (JSON Web Token) 处理的核心库
using System.Security.Claims;          // 引入声明 (Claims) 相关类型，用于构建用户身份信息
using System.Text;                     // 引入文本编码相关类型，如 Encoding
using Microsoft.EntityFrameworkCore;   // 引入 Entity Framework Core，用于数据库操作
using Microsoft.Extensions.Configuration; // 引入配置接口，用于读取配置文件中的设置 (如 JWT 密钥)
using Microsoft.IdentityModel.Tokens;  // 引入安全令牌相关类型，如 SymmetricSecurityKey
using MyNextBlog.Data;                 // 引入数据访问层命名空间，包含 AppDbContext
using MyNextBlog.DTOs;                 // 引入数据传输对象，如 LoginDto, AuthResponseDto
using MyNextBlog.Models;               // 引入领域模型，如 User
using BCrypt.Net;                     // 引入 BCrypt 库，用于安全地哈希和验证密码

// `namespace` 声明了当前文件中的代码所属的命名空间。
namespace MyNextBlog.Services;

/// <summary>
/// `AuthService` 是一个专门负责用户身份认证的业务服务类，实现了 `IAuthService` 接口。
/// 它的核心职责包括：
///   - 验证用户提供的登录凭证（用户名和密码）。
///   - 在验证成功后，签发一个 JWT (JSON Web Token) 作为用户的身份凭证。
///   - 管理与认证相关的安全操作，例如密码哈希的对比。
/// </summary>
// `public class AuthService(...) : IAuthService`
//   - `AppDbContext context`: 注入数据库上下文，用于查询用户信息。
//   - `IConfiguration configuration`: 注入配置接口，用于读取应用程序的配置信息，特别是 JWT 相关的安全设置。
public class AuthService(AppDbContext context, IConfiguration configuration) : IAuthService
{
    /// <summary>
    /// `LoginAsync` 方法处理用户的登录请求，验证用户名和密码，并在成功时签发 JWT。
    /// </summary>
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await AuthenticateAsync(dto.Username, dto.Password);
        if (user == null) return null;

        var tokenString = GenerateJwtToken(user);

        return new AuthResponseDto(
            Token: tokenString,
            Expiration: DateTime.UtcNow.AddDays(7), 
            Username: user.Username,
            Role: user.Role
        );
    }

    public async Task<User?> AuthenticateAsync(string username, string password)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            return null;
        }
        return user;
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public string GenerateJwtToken(User user)
    {
        // 2. **构建 Claims (用户身份声明)**
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        // 3. **准备签名密钥**
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]; 
        
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("Server configuration error: Missing JWT SecretKey in JwtSettings.");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 4. **签发 JWT Token**
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}