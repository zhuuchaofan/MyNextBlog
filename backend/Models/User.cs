namespace MyTechBlog.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // 以后存加密密码

    // 新增：角色字段，默认是 "User" (普通用户)
    public string Role { get; set; } = "User";
}