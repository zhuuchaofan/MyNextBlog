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
    /// <param name="dto">`LoginDto` 包含用户尝试登录的 `Username` 和 `Password`。</param>
    /// <returns>
    ///   - 如果登录凭证有效，返回一个包含 JWT Token 和用户基本信息的 `AuthResponseDto` 对象。
    ///   - 如果登录失败（用户名不存在或密码不匹配），则返回 `null`。
    /// </returns>
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        // 1. **查找用户并验证密码**
        // `context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username)`:
        //   - 异步查询数据库的 `Users` 表，查找 `Username` 与 `dto.Username` 匹配的第一个用户。
        //   - `FirstOrDefaultAsync` 在找不到用户时会返回 `null`。
        var user = await context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);

        // `user == null`: 用户名不存在。
        // `!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)`:
        //   - `BCrypt.Net.BCrypt.Verify()`: 这是 BCrypt 库提供的一个方法，用于验证明文密码是否与哈希密码匹配。
        //     BCrypt 是一种安全的密码哈希算法，它会“加盐”（为每个密码生成一个随机的、独特的字符串，然后与密码一起哈希），
        //     并进行多次迭代（工作因子），使得彩虹表攻击和暴力破解变得非常困难。
        //   - **重要**: 永远不要直接存储用户的明文密码。所有密码都应该经过哈希处理后存储。
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return null; // 用户名不存在或密码错误，返回 null 表示登录失败。
        }

        // 2. **构建 Claims (用户身份声明)**
        // `Claims` 是关于用户身份和授权的一组属性。它们会被编码到 JWT Token 中。
        // 一旦 Token 被签发，后端 API 就可以直接从 Token 中读取这些 Claims，而无需再次查询数据库，
        // 从而提高验证效率和减轻数据库负担。
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),               // 添加用户名为 `Name` 声明
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // 添加用户 ID 为 `NameIdentifier` 声明（唯一标识符）
            new Claim(ClaimTypes.Role, user.Role)                    // 添加用户角色为 `Role` 声明
        };

        // 3. **准备签名密钥**
        // `configuration.GetSection("JwtSettings")`: 从应用程序配置中获取名为 "JwtSettings" 的配置节。
        // 这个配置节通常在 `appsettings.json` 中定义。
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]; // 从配置中读取 JWT 签发和验证所需的秘密密钥。
        
        // **防御性编程**: 检查密钥是否配置。如果密钥为空，说明配置不完整，直接抛出异常，
        // 避免应用程序在运行时出现意料之外的安全漏洞。
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("Server configuration error: Missing JWT SecretKey in JwtSettings.");
        }

        // `SymmetricSecurityKey`: 创建一个对称加密密钥的实例。对称密钥意味着加密和解密使用同一个密钥。
        // `Encoding.UTF8.GetBytes(secretKey)`: 将秘密密钥字符串转换为 UTF-8 编码的字节数组。
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        // `SigningCredentials`: 创建用于签名 JWT Token 的凭证。
        // `SecurityAlgorithms.HmacSha256`: 指定使用 HMAC SHA256 算法进行签名。
        // 这个算法确保了 Token 的完整性，防止在传输过程中被篡改。
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 4. **签发 JWT Token**
        // `JwtSecurityToken` 类的实例代表了一个 JWT Token。
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],                       // `Issuer`: Token 的颁发者 (例如你的域名)
            audience: jwtSettings["Audience"],                   // `Audience`: Token 的受众 (例如你的应用程序名称)
            claims: claims,                                      // `Claims`: 之前构建的用户身份声明列表
            expires: DateTime.UtcNow.AddDays(7),                 // `Expires`: Token 的过期时间，这里设置为从现在起 7 天后。
                                                                 // `DateTime.UtcNow` 使用 UTC 时间，避免跨时区问题。
            signingCredentials: creds                            // `SigningCredentials`: 用于对 Token 进行签名，确保其真实性和完整性。
        );

        // `new JwtSecurityTokenHandler().WriteToken(token)`: 将 `JwtSecurityToken` 对象序列化为标准的 JWT 字符串。
        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        // 5. **返回认证响应**
        // 创建并返回 `AuthResponseDto`，其中包含生成的 `Token`、`Expiration` 时间、`Username` 和 `Role`。
        // 这些信息将发送给客户端，客户端可以在后续的请求中使用此 Token 进行身份验证。
        return new AuthResponseDto(
            Token: tokenString,
            Expiration: token.ValidTo, // `token.ValidTo` 表示 Token 的过期时间
            Username: user.Username,
            Role: user.Role
        );
    }
}