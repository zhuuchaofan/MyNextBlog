// ============================================================================
// DTOs/AuthDtos.cs - 认证相关数据传输对象
// ============================================================================
// 此文件定义了认证模块的 DTO，用于登录、注册、密码重置等 API。
//
// **DTO 分类**:
//   - 请求 DTO: `LoginDto`, `RegisterDto`, `ForgotPasswordDto`, `ResetPasswordDto`
//   - 响应 DTO: `AuthResponseDto` (包含 Token 和用户信息)
//   - Token DTO: `RefreshTokenRequestDto` (刷新 Token 请求)
//
// **安全说明**:
//   - 密码字段最小 6 字符
//   - Token 通过 HttpOnly Cookie 传输，不暴露给 JavaScript

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解，用于输入验证

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// 用户登录请求 DTO
/// </summary>
public record LoginDto(
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, ErrorMessage = "用户名长度不能超过50个字符")]
    string Username,
    
    [Required(ErrorMessage = "密码不能为空")]
    [StringLength(100, ErrorMessage = "密码长度不能超过100个字符")]
    string Password
);

public record RegisterDto(
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(20, MinimumLength = 3, ErrorMessage = "用户名长度必须在3-20个字符之间")]
    string Username,
    
    [Required(ErrorMessage = "密码不能为空")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "密码长度至少需要6个字符")]
    string Password,

    [Required(ErrorMessage = "邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    string Email
);

public record ForgotPasswordDto(
    [Required(ErrorMessage = "邮箱不能为空")]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    string Email
);

public record ResetPasswordDto(
    [Required] string Token,
    [Required] string Email,
    [Required] [StringLength(100, MinimumLength = 6)] string NewPassword
);

public record AuthResponseDto(
    string Token,
    string RefreshToken, // Added
    DateTime Expiration,
    string Username,
    string Role,
    string? AvatarUrl, // 新增：用户头像，登录后立即可用
    string? Nickname,
    string? Bio,
    string? Website,
    string? Location,
    string? Occupation,
    string? BirthDate,
    string? Email
);

public record RefreshTokenRequestDto(
    string AccessToken,
    string RefreshToken
);