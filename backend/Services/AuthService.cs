using System.IdentityModel.Tokens.Jwt; 
using System.Security.Claims;          
using System.Text;
using System.Security.Cryptography; // Added for RNG and SHA256
using Microsoft.EntityFrameworkCore;   
using Microsoft.Extensions.Configuration; 
using Microsoft.IdentityModel.Tokens;  
using MyNextBlog.Data;                 
using MyNextBlog.DTOs;                 
using MyNextBlog.Models;               
using MyNextBlog.Services.Email;

namespace MyNextBlog.Services;

public class AuthService(AppDbContext context, IConfiguration configuration, IEmailService emailService) : IAuthService
{
    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await AuthenticateAsync(dto.Username, dto.Password);
        if (user == null) return null;

        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        
        // 保存刷新令牌 (哈希存储)
        user.RefreshTokenHash = HashToken(refreshToken);
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7); // 7天有效期
        
        await context.SaveChangesAsync();

        return new AuthResponseDto(
            Token: accessToken,
            RefreshToken: refreshToken, // 返回给前端的是明文
            Expiration: DateTime.UtcNow.AddMinutes(15), 
            Username: user.Username,
            Role: user.Role,
            AvatarUrl: user.AvatarUrl, // 新增：立即返回头像
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
        var principal = GetPrincipalFromExpiredToken(dto.AccessToken);
        if (principal == null) return null; // 无效的 AccessToken 格式

        var userIdStr = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId)) return null;

        var user = await context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow || string.IsNullOrEmpty(user.RefreshTokenHash))
        {
            return null; // 用户不存在 或 令牌过期 或 未登录
        }

        // 验证 Refresh Token (比对哈希)
        if (!VerifyTokenHash(dto.RefreshToken, user.RefreshTokenHash))
        {
            return null; // 令牌无效
        }

        // 核心优化：避免"惊群效应" (Thundering Herd)
        // 策略：如果 Refresh Token 还有较长的有效期（> 3天），则**不**进行轮换 (Rotation)。
        // 只有当有效期不足 3 天时，才生成新的 Refresh Token。
        string newRefreshToken = dto.RefreshToken; // 默认使用旧的
        
        // 检查剩余有效期
        var remainingTime = user.RefreshTokenExpiryTime - DateTime.UtcNow;
        if (remainingTime < TimeSpan.FromDays(3))
        {
            // 剩余不足3天 -> 进行轮换
            newRefreshToken = GenerateRefreshToken();
            user.RefreshTokenHash = HashToken(newRefreshToken);
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7); // 重置为7天
        }

        // 每次都生成新的 Access Token
        var newAccessToken = GenerateJwtToken(user);
        
        await context.SaveChangesAsync();

        return new AuthResponseDto(
            Token: newAccessToken,
            RefreshToken: newRefreshToken, // 返回决定使用的那个 (旧的或新的)
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

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string? token)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"];
        
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true, // 这里保持一致
            ValidAudience = jwtSettings["Audience"],
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
            ValidateLifetime = false // *** 关键：允许过期 Token ***
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try 
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");

            return principal;
        }
        catch
        {
            return null;
        }
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
    
    private bool VerifyTokenHash(string token, string hash)
    {
        var newHash = HashToken(token);
        return newHash == hash;
    }

    public async Task<AuthResult> RegisterAsync(string username, string password, string email)
    {
        if (await context.Users.AnyAsync(u => u.Username == username))
        {
            return new AuthResult(false, "用户名已存在", null, null);
        }

        if (await context.Users.AnyAsync(u => u.Email == email))
        {
            return new AuthResult(false, "该邮箱已被注册", null, null);
        }

        var user = new User
        {
            Username = username,
            Email = email, // Added
            Role = "User", // Default role
            AvatarUrl = null
        };
        
        user.PasswordHash = HashPassword(password);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        // 注册后暂不自动登录 (如果需要自动登录，也应该生成 RefreshToken)
        // 为了简化，这里返回 Success 但不包含 Token，让前端引导去登录？
        // 或者也生成一套 Token。这里我们保持原样仅仅生成 Token (Access Only) or Fix it?
        // 原逻辑返回了 Token。我们这里也生成一套完整的吧。
        
        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();
        user.RefreshTokenHash = HashToken(refreshToken);
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await context.SaveChangesAsync();

        return new AuthResult(true, "注册成功", user, accessToken); 
        // Note: AuthResult struct needs update if we want to return RefreshToken via Register too, 
        // or just let them login. The original AuthResult only has one Token string. 
        // Let's keep it simple: Register returns AccessToken, but user can Login to get RefreshToken?
        // Better: Login after Register. 
        // But for maintaining 'AuthResult' signature (it's a record/class), I won't change it deeply now.
        // The implementation_plan didn't say we change AuthResult signature extensively.
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
        // 重置密码后，为了安全，应该废弃旧的 Refresh Token，让所有设备重新登录
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiryTime = null;

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
            expires: DateTime.UtcNow.AddMinutes(15), // 修改为 15 分钟
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
