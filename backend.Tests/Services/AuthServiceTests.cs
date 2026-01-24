// ============================================================================
// backend.Tests/Services/AuthServiceTests.cs - AuthService 单元测试
// ============================================================================
// 测试认证服务的核心功能：登录、注册、Token 刷新。
// 使用 EF Core InMemory 数据库模拟真实环境。

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;
using MyNextBlog.Services;
using MyNextBlog.Services.Email;

namespace backend.Tests.Services;

/// <summary>
/// AuthService 单元测试
/// </summary>
public class AuthServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<ILogger<AuthService>> _mockLogger;
    private readonly IConfiguration _configuration;

    public AuthServiceTests()
    {
        // 创建 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        _context = new AppDbContext(options);
        _mockEmailService = new Mock<IEmailService>();
        _mockLogger = new Mock<ILogger<AuthService>>();
        
        // 模拟配置
        var configData = new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "ThisIsAVeryLongSecretKeyForTestingPurposes12345678",
            ["JwtSettings:Issuer"] = "TestIssuer",
            ["JwtSettings:Audience"] = "TestAudience",
            ["AppUrl"] = "http://localhost:3000"
        };
        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();
        
        // AuthService 构造函数: (context, configuration, emailService, logger)
        _authService = new AuthService(
            _context, 
            _configuration,
            _mockEmailService.Object,
            _mockLogger.Object);
        
        // 播种测试数据
        SeedTestData();
    }

    private void SeedTestData()
    {
        // 创建测试用户 (密码: "password123")
        var user = new User
        {
            Id = 1,
            Username = "testuser",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            Email = "test@test.com",
            Role = "User"
        };
        _context.Users.Add(user);

        // 创建管理员用户
        var admin = new User
        {
            Id = 2,
            Username = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Email = "admin@test.com",
            Role = "Admin"
        };
        _context.Users.Add(admin);

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    // ========== 登录测试 ==========

    [Fact]
    public async Task LoginAsync_ShouldReturnToken_WhenCredentialsAreValid()
    {
        // Arrange
        var dto = new LoginDto("testuser", "password123");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.Username.Should().Be("testuser");
        result.Role.Should().Be("User");
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnNull_WhenUsernameNotExists()
    {
        // Arrange
        var dto = new LoginDto("nonexistent", "password123");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnNull_WhenPasswordIsWrong()
    {
        // Arrange
        var dto = new LoginDto("testuser", "wrongpassword");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_ShouldCreateRefreshToken()
    {
        // Arrange
        var dto = new LoginDto("testuser", "password123");

        // Act
        var result = await _authService.LoginAsync(dto);

        // Assert
        result.Should().NotBeNull();
        var refreshTokenCount = await _context.RefreshTokens.CountAsync(rt => rt.UserId == 1);
        refreshTokenCount.Should().BeGreaterThanOrEqualTo(1);
    }

    // ========== 注册测试 ==========

    [Fact]
    public async Task RegisterAsync_ShouldCreateNewUser()
    {
        // Arrange
        var username = "newuser";
        var password = "newpassword123";
        var email = "newuser@test.com";

        // Act
        var result = await _authService.RegisterAsync(username, password, email);

        // Assert
        result.Should().NotBeNull();
        result!.Username.Should().Be(username);
        result.Token.Should().NotBeNullOrEmpty();
        
        // 验证用户确实被创建
        var userExists = await _context.Users.AnyAsync(u => u.Username == username);
        userExists.Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_ShouldReturnNull_WhenUsernameExists()
    {
        // Arrange (testuser 已存在)
        var username = "testuser";
        var password = "password123";
        var email = "different@test.com";

        // Act
        var result = await _authService.RegisterAsync(username, password, email);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task RegisterAsync_ShouldReturnNull_WhenEmailExists()
    {
        // Arrange (test@test.com 已存在)
        var username = "differentuser";
        var password = "password123";
        var email = "test@test.com";

        // Act
        var result = await _authService.RegisterAsync(username, password, email);

        // Assert
        result.Should().BeNull();
    }

    // ========== Token 刷新测试 ==========

    [Fact]
    public async Task RefreshTokenAsync_ShouldReturnNewAccessToken_WhenTokenIsValid()
    {
        // Arrange: 先登录获取 Refresh Token
        var loginResult = await _authService.LoginAsync(new LoginDto("testuser", "password123"));
        loginResult.Should().NotBeNull();
        
        var dto = new RefreshTokenRequestDto(loginResult!.Token, loginResult!.RefreshToken);

        // Act
        var result = await _authService.RefreshTokenAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task RefreshTokenAsync_ShouldReturnNull_WhenTokenIsInvalid()
    {
        // Arrange
        var dto = new RefreshTokenRequestDto("expired.token", "invalid-refresh-token");

        // Act
        var result = await _authService.RefreshTokenAsync(dto);

        // Assert
        result.Should().BeNull();
    }

    // ========== 认证验证测试 ==========

    [Fact]
    public async Task AuthenticateAsync_ShouldReturnUser_WhenCredentialsAreValid()
    {
        // Act
        var user = await _authService.AuthenticateAsync("testuser", "password123");

        // Assert
        user.Should().NotBeNull();
        user!.Username.Should().Be("testuser");
    }

    [Fact]
    public async Task AuthenticateAsync_ShouldReturnNull_WhenPasswordIsWrong()
    {
        // Act
        var user = await _authService.AuthenticateAsync("testuser", "wrongpassword");

        // Assert
        user.Should().BeNull();
    }

    // ========== 密码哈希测试 ==========

    [Fact]
    public void HashPassword_ShouldGenerateDifferentHashForSamePassword()
    {
        // BCrypt 每次生成不同的盐，所以相同密码会产生不同的哈希
        var hash1 = _authService.HashPassword("password123");
        var hash2 = _authService.HashPassword("password123");

        hash1.Should().NotBe(hash2);
    }

    [Fact]
    public void HashPassword_ShouldBeVerifiable()
    {
        var password = "mySecurePassword";
        var hash = _authService.HashPassword(password);

        BCrypt.Net.BCrypt.Verify(password, hash).Should().BeTrue();
    }

    // ========== 宽限期并发测试 ==========

    [Fact]
    public async Task RefreshTokenAsync_ShouldAllowConcurrentRefreshWithinGracePeriod()
    {
        // Arrange: 登录获取 Token
        var loginResult = await _authService.LoginAsync(new LoginDto("testuser", "password123"));
        loginResult.Should().NotBeNull();
        
        // 模拟 Token 即将过期以触发轮换 (剩余 < 3 天)
        var token = await _context.RefreshTokens.FirstAsync(rt => rt.UserId == 1);
        token.ExpiryTime = DateTime.UtcNow.AddDays(1);
        await _context.SaveChangesAsync();
        
        var dto = new RefreshTokenRequestDto(loginResult!.Token, loginResult!.RefreshToken);
        
        // Act: 第一次刷新 (触发轮换，标记 RevokedAt)
        var result1 = await _authService.RefreshTokenAsync(dto);
        // Act: 第二次刷新 (宽限期内，应成功生成并行链)
        var result2 = await _authService.RefreshTokenAsync(dto);
        
        // Assert
        result1.Should().NotBeNull();
        result2.Should().NotBeNull();
        // 两次刷新应生成不同的 Refresh Token (并行链)
        result1!.RefreshToken.Should().NotBe(result2!.RefreshToken);
    }

    [Fact]
    public async Task RefreshTokenAsync_ShouldRejectAfterGracePeriod()
    {
        // Arrange: 登录获取 Token
        var loginResult = await _authService.LoginAsync(new LoginDto("testuser", "password123"));
        loginResult.Should().NotBeNull();
        
        var token = await _context.RefreshTokens.FirstAsync(rt => rt.UserId == 1);
        
        // 模拟撤销已超过 10 秒宽限期
        token.RevokedAt = DateTime.UtcNow.AddSeconds(-15);
        token.ExpiryTime = DateTime.UtcNow.AddDays(1); // 未过期
        await _context.SaveChangesAsync();
        
        var dto = new RefreshTokenRequestDto(loginResult!.Token, loginResult!.RefreshToken);
        
        // Act
        var result = await _authService.RefreshTokenAsync(dto);
        
        // Assert: 宽限期已过，应拒绝
        result.Should().BeNull();
    }
}
