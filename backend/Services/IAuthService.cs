using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken); // 直接接收 RefreshToken 字符串
}
