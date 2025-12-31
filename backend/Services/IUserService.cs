// ============================================================================
// Services/IUserService.cs - 用户服务接口
// ============================================================================
// 此接口定义了用户个人资料管理的业务契约。

// `using` 语句用于导入必要的命名空间
using MyNextBlog.DTOs;    // 数据传输对象
using MyNextBlog.Models;  // 领域模型

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Services;

/// <summary>
/// `IUserService` 定义了用户/个人资料模块的业务逻辑接口。
/// </summary>
public interface IUserService
{
    Task<User?> GetUserByIdAsync(int userId);
    Task<UserResult> UpdateProfileAsync(int userId, UpdateProfileDto dto);
    Task<UserResult> UpdateAvatarAsync(int userId, Stream stream, string fileName, string contentType, long length);
}

public record UserResult(bool Success, string Message, User? User);
