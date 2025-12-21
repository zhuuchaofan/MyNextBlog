using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RefreshTokenAsync(RefreshTokenRequestDto dto);
    Task<AuthResult> RegisterAsync(string username, string password, string email);

    // Password Reset
    Task<AuthResult> ForgotPasswordAsync(string email);
    Task<AuthResult> ResetPasswordAsync(string email, string token, string newPassword);

    // Helper methods for controller (if needed, or can be private/internal if fully refactored)
    Task<User?> AuthenticateAsync(string username, string password);
    string GenerateJwtToken(User user);
    string HashPassword(string password);
}

public record AuthResult(bool Success, string Message, User? User, string? Token);