// ============================================================================
// DTOs/AccountDtos.cs - 账户相关数据传输对象
// ============================================================================
// 此文件定义了用户账户模块的 DTO，用于个人资料管理。
//
// **DTO 用途**:
//   - `UpdateProfileDto`: 更新个人资料请求
//   - `UserDto`: 用户信息响应 (含工厂方法 FromEntity)

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解，用于输入验证
using MyNextBlog.Models;                      // 领域模型，用于实体转换

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// 更新个人资料请求 DTO
/// </summary>
public record UpdateProfileDto(
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    string? Email,
    
    [StringLength(20, ErrorMessage = "昵称不能超过20个字符")]
    string? Nickname,
    
    [StringLength(100, ErrorMessage = "个人简介不能超过100个字符")]
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
