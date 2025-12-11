namespace MyNextBlog.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // 以后存加密密码

    // 新增：角色字段，默认是 "User" (普通用户)
    public string Role { get; set; } = "User";

    // 新增：用户头像 URL (可空，未设置则使用默认或随机头像)
    public string? AvatarUrl { get; set; }

    // 新增：JWT Refresh Token (用于无感刷新)
    public string? RefreshToken { get; set; }

    // 新增：Refresh Token 过期时间
    public DateTime? RefreshTokenExpiryTime { get; set; }
}