using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public class UserService(AppDbContext context, IStorageService storageService) : IUserService
{
    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<UserResult> UpdateProfileAsync(int userId, UpdateProfileDto dto)
    {
        var user = await context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new UserResult(false, "用户不存在", null);
        }

        if (dto.Email != null)
        {
            if (!string.IsNullOrWhiteSpace(dto.Email) && !dto.Email.Contains("@"))
            {
                return new UserResult(false, "邮箱格式不正确", null);
            }
            user.Email = dto.Email;
        }

        if (dto.Nickname != null) user.Nickname = dto.Nickname;
        if (dto.Bio != null) user.Bio = dto.Bio;
        if (dto.Website != null) user.Website = dto.Website;

        // Handle UserProfile
        if (dto.Location != null || dto.Occupation != null || dto.BirthDate != null)
        {
            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile { UserId = userId };
            }

            if (dto.Location != null) user.UserProfile.Location = dto.Location;
            if (dto.Occupation != null) user.UserProfile.Occupation = dto.Occupation;
            if (dto.BirthDate != null) user.UserProfile.BirthDate = dto.BirthDate;
        }

        await context.SaveChangesAsync();
        return new UserResult(true, "更新成功", user);
    }

    public async Task<UserResult> UpdateAvatarAsync(int userId, Stream stream, string fileName, string contentType, long length)
    {
        // Validation
        if (!contentType.StartsWith("image/"))
            return new UserResult(false, "只能上传图片文件", null);

        if (length > 5 * 1024 * 1024)
            return new UserResult(false, "图片大小不能超过 5MB", null);

        var user = await context.Users.FindAsync(userId);
        if (user == null)
            return new UserResult(false, "用户不存在", null);

        try
        {
            // Upload to Cloud Storage
            var result = await storageService.UploadAsync(stream, fileName, contentType, "avatars");

            // Update User
            user.AvatarUrl = result.Url;
            await context.SaveChangesAsync();

            return new UserResult(true, "上传成功", user);
        }
        catch (Exception ex)
        {
            return new UserResult(false, $"上传失败: {ex.Message}", null);
        }
    }
}
