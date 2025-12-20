using System.ComponentModel.DataAnnotations; // Added this line

namespace MyNextBlog.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // 以后存加密密码

    // 新增：角色字段，默认是 "User" (普通用户)
    public string Role { get; set; } = "User";

    // 新增：用户头像 URL (可空，未设置则使用默认或随机头像)
    public string? AvatarUrl { get; set; } // 用户头像 URL

    public string? Email { get; set; } // 用户邮箱
    
    // 密码重置相关
    public string? PasswordResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }

    // 扩展资料
    [MaxLength(50)]
    public string? Nickname { get; set; } // 昵称 (显示名)
    
    [MaxLength(200)]
    public string? Bio { get; set; } // 个人简介
    
    [MaxLength(200)]
    public string? Website { get; set; } // 个人网站

    // 新增：扩展资料 (1对1关系)
    public UserProfile? UserProfile { get; set; }
}