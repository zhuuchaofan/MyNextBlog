using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

public record LoginDto(
    [Required(ErrorMessage = "用户名不能为空")]
    string Username,
    
    [Required(ErrorMessage = "密码不能为空")]
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
    string? AvatarUrl // 新增：用户头像，登录后立即可用
);

public record RefreshTokenRequestDto(
    string AccessToken,
    string RefreshToken
);