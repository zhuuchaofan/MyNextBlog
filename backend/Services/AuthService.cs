// `using` 语句用于导入必要的命名空间。
using System.IdentityModel.Tokens.Jwt; // 引入 JWT (JSON Web Token) 处理的核心库
using System.Security.Claims;          // 引入声明 (Claims) 相关类型，用于构建用户身份信息
using System.Text;                     // 引入文本编码相关类型，如 Encoding
using Microsoft.EntityFrameworkCore;   // 引入 Entity Framework Core，用于数据库操作
using Microsoft.Extensions.Configuration; // 引入配置接口，用于读取配置文件中的设置 (如 JWT 密钥)
using Microsoft.IdentityModel.Tokens;  // 引入安全令牌相关类型，如 SymmetricSecurityKey
using System.Security.Cryptography;    // 引入加密库，用于生成随机 RefreshToken
using MyNextBlog.Data;                 // 引入数据访问层命名空间，包含 AppDbContext
using MyNextBlog.DTOs;                 // 引入数据传输对象, 如 LoginDto, AuthResponseDto
using MyNextBlog.Models;               // 引入领域模型，如 User
using BCrypt.Net;                     // 引入 BCrypt 库，用于安全地哈希和验证密码

// `namespace` 声明了当前文件中的代码所属的命名空间。
namespace MyNextBlog.Services;

/// <summary>
/// `AuthService` 是一个专门负责用户身份认证的业务服务类，实现了 `IAuthService` 接口。
/// </summary>
public class AuthService(AppDbContext context, IConfiguration configuration) : IAuthService
{
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return null;
        }

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
    {
        // 直接根据 RefreshToken 查找用户
        var user = await context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        // 验证 Refresh Token:
        // 1. 用户是否存在
        // 2. RefreshToken 是否已过期
        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return null; // 验证失败，必须重新登录
        }

        return await GenerateAuthResponseAsync(user);
    }

    // --- 私有辅助方法 ---

    private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        if (string.IsNullOrEmpty(secretKey)) throw new InvalidOperationException("Missing JWT SecretKey");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        // 1. 生成 Access Token (短效: 15分钟)
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15), 
            signingCredentials: creds
        );
        var accessTokenString = new JwtSecurityTokenHandler().WriteToken(token); // 命名改为 accessTokenString

        // 2. 生成 Refresh Token (随机字符串)
        var refreshToken = GenerateRefreshToken();

        // 3. 保存 Refresh Token 到数据库 (长效: 7天)
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await context.SaveChangesAsync();

        return new AuthResponseDto(
            AccessToken: accessTokenString, // 命名改为 AccessToken
            RefreshToken: refreshToken,
            Expiration: token.ValidTo,
            Username: user.Username,
            Role: user.Role
        );
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
}