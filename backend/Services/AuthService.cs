using System.IdentityModel.Tokens.Jwt; 
using System.Security.Claims;          
using System.Text;                     
using Microsoft.EntityFrameworkCore;   
using Microsoft.Extensions.Configuration; 
using Microsoft.IdentityModel.Tokens;  
using MyNextBlog.Data;                 
using MyNextBlog.DTOs;                 
using MyNextBlog.Models;               
using BCrypt.Net;                     

namespace MyNextBlog.Services;

public class AuthService(AppDbContext context, IConfiguration configuration) : IAuthService
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

    public async Task<AuthResult> RegisterAsync(string username, string password)
    {
        if (await context.Users.AnyAsync(u => u.Username == username))
        {
            return new AuthResult(false, "用户名已存在", null, null);
        }

        var user = new User
        {
            Username = username,
            Role = "User", // Default role
            AvatarUrl = null
        };
        
        user.PasswordHash = HashPassword(password);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        return new AuthResult(true, "注册成功", user, token);
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
