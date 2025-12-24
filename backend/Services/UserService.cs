using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public class UserService(AppDbContext context, IStorageService storageService) : IUserService
{
    // 允许的图片格式及其 Magic Bytes（文件头）
    private static readonly Dictionary<string, byte[]> AllowedImageMagicBytes = new()
    {
        { "jpg", [0xFF, 0xD8, 0xFF] },           // JPEG
        { "png", [0x89, 0x50, 0x4E, 0x47] },     // PNG
        { "gif", [0x47, 0x49, 0x46, 0x38] },     // GIF87a / GIF89a
        { "webp", [0x52, 0x49, 0x46, 0x46] }     // RIFF (WebP)
    };

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
        // 1. 基础验证：大小限制
        if (length > 5 * 1024 * 1024)
            return new UserResult(false, "图片大小不能超过 5MB", null);

        // 2. 安全验证：检查 Magic Bytes（文件头）而非信任 Content-Type
        var header = new byte[8];
        var bytesRead = await stream.ReadAsync(header.AsMemory(0, 8));
        stream.Position = 0; // 重置流位置，供后续上传使用

        if (bytesRead < 4)
            return new UserResult(false, "无效的图片文件", null);

        bool isValidImage = AllowedImageMagicBytes.Values
            .Any(magic => header.Take(magic.Length).SequenceEqual(magic));

        if (!isValidImage)
            return new UserResult(false, "仅支持 JPG/PNG/GIF/WebP 格式", null);

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
