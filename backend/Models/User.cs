// ============================================================================
// Models/User.cs - 用户/账户实体
// ============================================================================
// 此实体映射 `Users` 表，存储用户的基本账户信息和凭证。
//
// **核心功能**:
//   - 认证凭证: Username, PasswordHash (BCrypt)
//   - 权限控制: Role (Admin/User)
//   - 个人资料: 基本字段 (Nickname, Bio 等) + 关联 UserProfile

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Models;

/// <summary>
/// `User` 实体代表系统中的注册用户。
/// 
/// **特性**:
///   - 扩展性: 通过 `UserProfile` 1对1 关联存储详细信息
///   - 安全性: 支持多设备登录 (`RefreshTokens` 1对多)
/// </summary>
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

    // ===== 多设备登录支持 =====
    // Refresh Tokens (1对多关系) - 每个设备一个独立的 Token
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}