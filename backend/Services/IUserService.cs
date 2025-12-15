using MyNextBlog.Models;

namespace MyNextBlog.Services;

public interface IUserService
{
    Task<User?> GetUserByIdAsync(int userId);
    Task<UserResult> UpdateProfileAsync(int userId, string? email, string? nickname, string? bio, string? website);
    Task<UserResult> UpdateAvatarAsync(int userId, Stream stream, string fileName, string contentType, long length);
}

public record UserResult(bool Success, string Message, User? User);
