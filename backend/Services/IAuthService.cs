using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    
    // Helper methods for controller
    Task<User?> AuthenticateAsync(string username, string password);
    string GenerateJwtToken(User user);
    string HashPassword(string password);
}
