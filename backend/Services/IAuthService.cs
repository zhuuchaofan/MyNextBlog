using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
}
