// ============================================================================
// backend.Tests/Services/UserServiceTests.cs - UserService 单元测试
// ============================================================================
// 测试用户服务的核心功能：获取用户、更新资料、头像上传验证

using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace backend.Tests.Services;

/// <summary>
/// UserService 单元测试
/// </summary>
public class UserServiceTests
{
    private static (SqliteConnection Connection, AppDbContext Context, UserService Service, Mock<IStorageService> StorageMock) CreateTestContext()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        
        var storageMock = new Mock<IStorageService>();
        var service = new UserService(context, storageMock.Object);
        
        SeedTestData(context);
        
        return (connection, context, service, storageMock);
    }

    private static void SeedTestData(AppDbContext context)
    {
        context.Users.AddRange(
            new User
            {
                Id = 1,
                Username = "testuser",
                PasswordHash = "hash",
                Email = "test@test.com",
                Nickname = "测试用户",
                Bio = "这是个人简介",
                Website = "https://example.com",
                UserProfile = new UserProfile
                {
                    UserId = 1,
                    Location = "北京",
                    Occupation = "程序员"
                }
            },
            new User
            {
                Id = 2,
                Username = "newuser",
                PasswordHash = "hash",
                Email = "new@test.com"
            }
        );

        context.SaveChanges();
    }

    // ========== GetUserByIdAsync 测试 ==========

    [Fact]
    public async Task GetUserByIdAsync_ShouldReturnUser_WhenExists()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var user = await service.GetUserByIdAsync(1);

            user.Should().NotBeNull();
            user!.Username.Should().Be("testuser");
            user.UserProfile.Should().NotBeNull();
            user.UserProfile!.Location.Should().Be("北京");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task GetUserByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var user = await service.GetUserByIdAsync(999);

            user.Should().BeNull();
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== UpdateProfileAsync 测试 ==========

    [Fact]
    public async Task UpdateProfileAsync_ShouldUpdateBasicFields()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new UpdateProfileDto(
                Email: null,
                Nickname: "新昵称",
                Bio: "新简介",
                Website: "https://new.com",
                Location: null,
                Occupation: null,
                BirthDate: null
            );

            var result = await service.UpdateProfileAsync(1, dto);

            result.Success.Should().BeTrue();
            result.User!.Nickname.Should().Be("新昵称");
            result.User.Bio.Should().Be("新简介");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateProfileAsync_ShouldUpdateEmail()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new UpdateProfileDto(
                Email: "newemail@test.com",
                Nickname: null,
                Bio: null,
                Website: null,
                Location: null,
                Occupation: null,
                BirthDate: null
            );

            var result = await service.UpdateProfileAsync(1, dto);

            result.Success.Should().BeTrue();
            result.User!.Email.Should().Be("newemail@test.com");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateProfileAsync_ShouldFail_WithInvalidEmail()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new UpdateProfileDto(
                Email: "invalid-email",
                Nickname: null,
                Bio: null,
                Website: null,
                Location: null,
                Occupation: null,
                BirthDate: null
            );

            var result = await service.UpdateProfileAsync(1, dto);

            result.Success.Should().BeFalse();
            result.Message.Should().Contain("邮箱格式");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateProfileAsync_ShouldFail_WhenUserNotExists()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new UpdateProfileDto(
                Email: null,
                Nickname: "test",
                Bio: null,
                Website: null,
                Location: null,
                Occupation: null,
                BirthDate: null
            );

            var result = await service.UpdateProfileAsync(999, dto);

            result.Success.Should().BeFalse();
            result.Message.Should().Contain("用户不存在");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateProfileAsync_ShouldCreateUserProfile_WhenNotExists()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            var dto = new UpdateProfileDto(
                Email: null,
                Nickname: null,
                Bio: null,
                Website: null,
                Location: "上海",
                Occupation: null,
                BirthDate: null
            );

            var result = await service.UpdateProfileAsync(2, dto); // User 2 没有 Profile

            result.Success.Should().BeTrue();
            result.User!.UserProfile.Should().NotBeNull();
            result.User.UserProfile!.Location.Should().Be("上海");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    // ========== UpdateAvatarAsync 测试 ==========

    [Fact]
    public async Task UpdateAvatarAsync_ShouldFail_WhenFileTooLarge()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            using var stream = new MemoryStream(new byte[10]);

            var result = await service.UpdateAvatarAsync(1, stream, "avatar.jpg", "image/jpeg", 6 * 1024 * 1024);

            result.Success.Should().BeFalse();
            result.Message.Should().Contain("5MB");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateAvatarAsync_ShouldFail_WithInvalidMagicBytes()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            // 不是有效的图片文件头
            using var stream = new MemoryStream("not an image"u8.ToArray());

            var result = await service.UpdateAvatarAsync(1, stream, "fake.jpg", "image/jpeg", stream.Length);

            result.Success.Should().BeFalse();
            result.Message.Should().Contain("JPG/PNG/GIF/WebP");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateAvatarAsync_ShouldFail_WhenUserNotExists()
    {
        var (connection, context, service, _) = CreateTestContext();
        try
        {
            // 有效的 JPEG 头
            var jpegHeader = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 };
            using var stream = new MemoryStream(jpegHeader);

            var result = await service.UpdateAvatarAsync(999, stream, "avatar.jpg", "image/jpeg", stream.Length);

            result.Success.Should().BeFalse();
            result.Message.Should().Contain("用户不存在");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateAvatarAsync_ShouldSucceed_WithValidJpeg()
    {
        var (connection, context, service, storageMock) = CreateTestContext();
        try
        {
            // 有效的 JPEG 头
            var jpegHeader = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 };
            using var stream = new MemoryStream(jpegHeader);

            storageMock.Setup(s => s.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new ImageUploadResult { Url = "https://cdn.example.com/avatar.jpg", StorageKey = "avatars/avatar.jpg" });

            var result = await service.UpdateAvatarAsync(1, stream, "avatar.jpg", "image/jpeg", stream.Length);

            result.Success.Should().BeTrue();
            result.User!.AvatarUrl.Should().Be("https://cdn.example.com/avatar.jpg");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateAvatarAsync_ShouldSucceed_WithValidPng()
    {
        var (connection, context, service, storageMock) = CreateTestContext();
        try
        {
            // 有效的 PNG 头
            var pngHeader = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
            using var stream = new MemoryStream(pngHeader);

            storageMock.Setup(s => s.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(new ImageUploadResult { Url = "https://cdn.example.com/avatar.png", StorageKey = "avatars/avatar.png" });

            var result = await service.UpdateAvatarAsync(1, stream, "avatar.png", "image/png", stream.Length);

            result.Success.Should().BeTrue();
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }

    [Fact]
    public async Task UpdateAvatarAsync_ShouldFail_WhenStorageThrows()
    {
        var (connection, context, service, storageMock) = CreateTestContext();
        try
        {
            var jpegHeader = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10 };
            using var stream = new MemoryStream(jpegHeader);

            storageMock.Setup(s => s.UploadAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .ThrowsAsync(new Exception("Network error"));

            var result = await service.UpdateAvatarAsync(1, stream, "avatar.jpg", "image/jpeg", stream.Length);

            result.Success.Should().BeFalse();
            result.Message.Should().Contain("上传失败");
        }
        finally
        {
            context.Dispose();
            connection.Dispose();
        }
    }
}
