// ============================================================================
// Services/AuthService.cs - 认证服务实现
// ============================================================================
// 此服务负责用户认证和授权的核心业务逻辑，包括：
//   - 用户登录/注册
//   - JWT Access Token 生成
//   - Refresh Token 轮换和多设备支持
//   - 密码重置流程
//
// **安全策略**:
//   - 使用 BCrypt 进行密码哈希 (抵抗彩虹表攻击)
//   - Refresh Token 存储为 SHA256 哈希 (即使数据库泄露也无法直接使用)
//   - 智能轮换策略：Token 剩余 < 3 天时才轮换 (防止并发请求"惊群效应")
//   - 密码重置后自动废弃所有设备的 Refresh Token

// `using` 语句用于导入必要的命名空间
using System.IdentityModel.Tokens.Jwt;  // JWT Token 处理
using System.Security.Claims;           // 用户声明 (Claims)
using System.Text;                      // 字符串编码
using System.Security.Cryptography;     // 加密算法 (SHA256, RNG)
using Microsoft.EntityFrameworkCore;    // EF Core 数据库操作
using Microsoft.Extensions.Configuration; // 配置访问
using Microsoft.Extensions.Logging;     // 日志
using Microsoft.IdentityModel.Tokens;   // JWT 签名凭据
using MyNextBlog.Data;                  // 数据访问层
using MyNextBlog.DTOs;                  // 数据传输对象
using MyNextBlog.Models;                // 领域模型
using MyNextBlog.Services.Email;        // 邮件服务 (密码重置)

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `AuthService` 是认证模块的核心服务类，实现 `IAuthService` 接口。
/// 
/// **主要功能**:
///   - `LoginAsync`: 用户登录，返回 Access Token 和 Refresh Token
///   - `RefreshTokenAsync`: 刷新 Token，支持懒惰轮换策略
///   - `RegisterAsync`: 用户注册，自动登录
///   - `ForgotPasswordAsync` / `ResetPasswordAsync`: 密码重置流程
/// 
/// **Token 策略**:
///   - Access Token: 15 分钟有效期，存储于 HttpOnly Cookie
///   - Refresh Token: 7 天有效期，剩余 < 3 天时自动轮换
///   - 多设备支持：每个设备独立的 Refresh Token，互不影响
/// </summary>
public class AuthService(
    AppDbContext context, 
    IConfiguration configuration, 
    IEmailService emailService,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        logger.LogInformation("User login attempt: {Username}", dto.Username);
        
        var user = await AuthenticateAsync(dto.Username, dto.Password);
        if (user == null)
        {
            logger.LogWarning("Login failed for user: {Username} - Invalid credentials", dto.Username);
            return null;
        }

        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        
        // ===== 多设备登录支持：添加新的 RefreshToken 到集合 =====
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(refreshToken),
            ExpiryTime = DateTime.UtcNow.AddDays(7), // 7天有效期
            DeviceInfo = null, // 可以从 User-Agent 解析，暂时为空
            CreatedAt = DateTime.UtcNow,
            LastUsedAt = DateTime.UtcNow
        };
        
        context.RefreshTokens.Add(refreshTokenEntity);
        await context.SaveChangesAsync();

        logger.LogInformation(
            "User logged in successfully: UserId={UserId}, Username={Username}, Role={Role}",
            user.Id, user.Username, user.Role
        );

        return new AuthResponseDto(
            Token: accessToken,
            RefreshToken: refreshToken, // 返回给前端的是明文
            Expiration: DateTime.UtcNow.AddMinutes(15), 
            Username: user.Username,
            Role: user.Role,
            AvatarUrl: user.AvatarUrl,
            Nickname: user.Nickname,
            Bio: user.Bio,
            Website: user.Website,
            Location: user.UserProfile?.Location,
            Occupation: user.UserProfile?.Occupation,
            BirthDate: user.UserProfile?.BirthDate?.ToString("yyyy-MM-dd"),
            Email: user.Email
        );
    }

    public async Task<AuthResponseDto?> RefreshTokenAsync(RefreshTokenRequestDto dto)
    {
        // 方案 B 重构：不再依赖 Access Token 提取用户信息
        // 直接通过 Refresh Token 查找关联的 User 和 Session
        
        var tokenHash = HashToken(dto.RefreshToken);
        
        var storedToken = await context.RefreshTokens
            .Include(rt => rt.User)             // 级联加载 User (基础信息)
            .ThenInclude(u => u.UserProfile)    // 级联加载 UserProfile (详细信息)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        // 1. 验证 Token 是否存在且未过期
        if (storedToken == null || storedToken.ExpiryTime <= DateTime.UtcNow)
        {
            logger.LogWarning("Token refresh failed: Invalid or expired refresh token");
            return null; // 无效或已过期
        }

        var user = storedToken.User;
        if (user == null) return null; // 极端情况：用户已被删除

        // 2. 轮换策略 (Rotation Strategy)
        // 避免"惊群效应"：如果 Refresh Token 还有较长的有效期（> 3天），则**不**进行轮换。
        string newRefreshToken = dto.RefreshToken; // 默认使用旧的
        
        var remainingTime = storedToken.ExpiryTime - DateTime.UtcNow;
        if (remainingTime < TimeSpan.FromDays(3))
        {
            // 剩余不足3天 -> 进行轮换：删除旧 Token，创建新 Token
            context.RefreshTokens.Remove(storedToken);
            
            newRefreshToken = GenerateRefreshToken();
            var newTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                TokenHash = HashToken(newRefreshToken),
                ExpiryTime = DateTime.UtcNow.AddDays(7), // 重置为7天
                DeviceInfo = storedToken.DeviceInfo,
                CreatedAt = DateTime.UtcNow,
                LastUsedAt = DateTime.UtcNow
            };
            context.RefreshTokens.Add(newTokenEntity);
        }
        else
        {
            // 只更新最后使用时间
            storedToken.LastUsedAt = DateTime.UtcNow;
        }

        // 3. 生成新的 Access Token
        var newAccessToken = GenerateJwtToken(user);
        
        await context.SaveChangesAsync();

        logger.LogInformation(
            "Token refreshed successfully: UserId={UserId}, Username={Username}, Rotated={Rotated}",
            user.Id, user.Username, newRefreshToken != dto.RefreshToken
        );

        return new AuthResponseDto(
            Token: newAccessToken,
            RefreshToken: newRefreshToken, // 返回决定使用的那个 (旧的或新的)
            Expiration: DateTime.UtcNow.AddMinutes(15), // 15 分钟
            Username: user.Username,
            Role: user.Role,
            AvatarUrl: user.AvatarUrl,
            Nickname: user.Nickname,
            Bio: user.Bio,
            Website: user.Website,
            Location: user.UserProfile?.Location,
            Occupation: user.UserProfile?.Occupation,
            BirthDate: user.UserProfile?.BirthDate?.ToString("yyyy-MM-dd"),
            Email: user.Email
        );
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    public async Task<AuthResponseDto?> RegisterAsync(string username, string password, string email)
    {
        logger.LogInformation(
            "User registration attempt: Username={Username}, Email={Email}",
            username, email
        );
        
        if (await context.Users.AnyAsync(u => u.Username == username))
        {
            logger.LogWarning("Registration failed: Username {Username} already exists", username);
            return null;
        }

        if (await context.Users.AnyAsync(u => u.Email == email))
        {
            logger.LogWarning("Registration failed: Email {Email} already exists", email);
            return null;
        }

        var user = new User
        {
            Username = username,
            Email = email, 
            Role = "User", // Default role
            AvatarUrl = null,
            UserProfile = new UserProfile 
            {
                // CreatedAt not available in model
            }
        };
        
        user.PasswordHash = HashPassword(password);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        // 注册后自动登录：生成 Access Token 和 Refresh Token
        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        
        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(refreshToken),
            ExpiryTime = DateTime.UtcNow.AddDays(7),
            DeviceInfo = null,
            CreatedAt = DateTime.UtcNow,
            LastUsedAt = DateTime.UtcNow
        };
        
        context.RefreshTokens.Add(refreshTokenEntity);
        await context.SaveChangesAsync();

        logger.LogInformation(
            "User registered successfully: UserId={UserId}, Username={Username}",
            user.Id, user.Username
        );

        // 返回完整的认证响应
        return new AuthResponseDto(
            Token: accessToken,
            RefreshToken: refreshToken,
            Expiration: DateTime.UtcNow.AddMinutes(15),
            Username: user.Username,
            Role: user.Role,
            AvatarUrl: user.AvatarUrl,
            Nickname: user.Nickname,
            Bio: user.Bio,
            Website: user.Website,
            Location: null,
            Occupation: null,
            BirthDate: null,
            Email: user.Email
        );
    }

    public async Task<AuthResult> ForgotPasswordAsync(string email)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            return new AuthResult(true, "如果您的邮箱已注册，重置链接将发送到您的邮箱。", null, null);
        }

        var token = Guid.NewGuid().ToString("N");
        user.PasswordResetToken = token;
        user.ResetTokenExpires = DateTime.UtcNow.AddMinutes(30);

        await context.SaveChangesAsync();

        var appUrl = configuration["AppUrl"]?.TrimEnd('/');
        var resetLink = $"{appUrl}/reset-password?token={token}&email={email}";

        var subject = "重置您的密码 - MyNextBlog";
        var body = $@"
            <h3>重置密码请求</h3>
            <p>您好，{user.Username}：</p>
            <p>我们收到了重置您 MyNextBlog 账户密码的请求。</p>
            <p>请点击下面的链接设置新密码（链接30分钟内有效）：</p>
            <p><a href='{resetLink}'>{resetLink}</a></p>
            <p>如果您没有请求重置密码，请忽略此邮件。</p>
        ";

        await emailService.SendEmailAsync(email, subject, body);

        return new AuthResult(true, "重置链接已发送", null, null);
    }

    public async Task<AuthResult> ResetPasswordAsync(string email, string token, string newPassword)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            return new AuthResult(false, "无效的请求", null, null);
        }

        if (user.PasswordResetToken != token || user.ResetTokenExpires < DateTime.UtcNow)
        {
            return new AuthResult(false, "重置链接无效或已过期", null, null);
        }

        user.PasswordHash = HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.ResetTokenExpires = null;
        
        // 重置密码后，为了安全，废弃所有设备的 Refresh Token，让所有设备重新登录
        var userTokens = await context.RefreshTokens
            .Where(rt => rt.UserId == user.Id)
            .ToListAsync();
        context.RefreshTokens.RemoveRange(userTokens);

        await context.SaveChangesAsync();

        return new AuthResult(true, "密码已重置，请使用新密码登录", null, null);
    }

    public async Task<User?> AuthenticateAsync(string username, string password)
    {
        var user = await context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.Username == username);

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
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]; 
        
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new InvalidOperationException("Server configuration error: Missing JWT SecretKey in JwtSettings.");
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15), // 正式配置: 15 分钟
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
