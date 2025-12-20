using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

public record UpdateProfileDto(
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    string? Email,
    
    [StringLength(50, ErrorMessage = "昵称不能超过50个字符")]
    string? Nickname,
    
    [StringLength(200, ErrorMessage = "个人简介不能超过200个字符")]
    string? Bio,
    
    [Url(ErrorMessage = "网站链接格式不正确")]
    string? Website
);
