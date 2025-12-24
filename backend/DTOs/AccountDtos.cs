using System.ComponentModel.DataAnnotations;
using MyNextBlog.Models;

namespace MyNextBlog.DTOs;

public record UpdateProfileDto(
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    string? Email,
    
    [StringLength(50, ErrorMessage = "昵称不能超过50个字符")]
    string? Nickname,
    
    [StringLength(200, ErrorMessage = "个人简介不能超过200个字符")]
    string? Bio,
    
    [Url(ErrorMessage = "网站链接格式不正确")]
    string? Website,
    
    [StringLength(100, ErrorMessage = "所在地不能超过100个字符")]
    string? Location,
    
    [StringLength(100, ErrorMessage = "职业不能超过100个字符")]
    string? Occupation,
    
    DateOnly? BirthDate
);

/// <summary>
/// 用户信息 DTO
/// 用于统一 API 响应格式，避免在 Controller 中构建匿名对象
/// </summary>
public record UserDto(
    int Id,
    string Username,
    string Role,
    string? AvatarUrl,
    string? Email,
    string? Nickname,
    string? Bio,
    string? Website,
    string? Location,
    string? Occupation,
    DateOnly? BirthDate
)
{
    /// <summary>
    /// 从 User 实体转换为 UserDto
    /// </summary>
    public static UserDto FromEntity(User user) => new(
        user.Id,
        user.Username,
        user.Role,
        user.AvatarUrl,
        user.Email,
        user.Nickname,
        user.Bio,
        user.Website,
        user.UserProfile?.Location,
        user.UserProfile?.Occupation,
        user.UserProfile?.BirthDate
    );
}
