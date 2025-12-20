using System.IdentityModel.Tokens.Jwt; 
using System.Security.Claims;          
using System.Text;                     
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

        var tokenString = GenerateJwtToken(user);

        return new AuthResponseDto(
            Token: tokenString,
            Expiration: DateTime.UtcNow.AddDays(7), 
            Username: user.Username,
            Role: user.Role
        );
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

        var token = GenerateJwtToken(user);

        return new AuthResult(true, "注册成功", user, token);
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

        await context.SaveChangesAsync();

        return new AuthResult(true, "密码已重置，请使用新密码登录", null, null);
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
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
