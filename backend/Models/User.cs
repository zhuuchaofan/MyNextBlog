using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Models;

public class User
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(256)] // BCrypt/Argon2 哈希长度
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Role { get; set; } = "User";

    [MaxLength(500)] // URL 上限
    public string? AvatarUrl { get; set; }

    [MaxLength(254)] // RFC 5321 邮箱地址标准最大长度
    public string? Email { get; set; }
    
    // 密码重置相关
    [MaxLength(256)]
    public string? PasswordResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }

    // 扩展资料
    [MaxLength(50)]
    public string? Nickname { get; set; }
    
    [MaxLength(200)]
    public string? Bio { get; set; }
    
    [MaxLength(200)]
    public string? Website { get; set; }

    // 扩展资料 (1对1关系)
    public UserProfile? UserProfile { get; set; }

    // JWT Refresh Token (存储哈希值)
    [MaxLength(256)]
    public string? RefreshTokenHash { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
}