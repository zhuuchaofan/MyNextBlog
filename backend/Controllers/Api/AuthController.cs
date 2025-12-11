// `using` 语句用于导入必要的命名空间。
using Microsoft.AspNetCore.Mvc;   // 引入 ASP.NET Core MVC 核心类型，如 ControllerBase, IActionResult, [HttpPost] 等
using MyNextBlog.DTOs;            // 引入数据传输对象，如 LoginDto
using MyNextBlog.Services;         // 引入业务服务层接口，如 IAuthService

// `namespace` 声明了当前文件中的代码所属的命名空间。
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `AuthController` 是一个 ASP.NET Core Web API 控制器，专注于处理用户身份认证相关的 HTTP 请求。
/// 这是一个**公开的控制器**，不需要用户登录即可访问其接口（例如登录接口本身）。
/// </summary>
// `[Route("api/[controller]")]` 特性：
//   - `api/`: 作为 API 路由的前缀。
//   - `[controller]`: 这是一个占位符，会被控制器的名称（不包含 "Controller" 后缀）替代。
//     对于 `AuthController`，其路由将是 `api/Auth`。
[Route("api/[controller]")]
// `[ApiController]` 特性：
// 为 Web API 控制器提供一系列约定和增强功能，简化开发。
[ApiController]
// `public class AuthController(IAuthService authService) : ControllerBase`
//   - `IAuthService authService`: 通过构造函数注入 `IAuthService` 接口的实现。
//     `AuthController` 依赖 `IAuthService` 来执行具体的认证逻辑（如验证用户名/密码，生成 JWT Token），
//     保持控制器逻辑的简洁，专注于 HTTP 请求/响应处理。
//   - `ControllerBase`: 提供处理 HTTP 请求所需的基本功能。
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>
    /// `Login` 方法是一个用户登录接口，用于处理用户的登录请求。
    /// </summary>
    /// <param name="dto">
    ///   `LoginDto` 是一个数据传输对象，它包含用户的 `Username` 和 `Password`。
    ///   `[FromBody]` 特性指示 `dto` 参数的值将从 HTTP 请求的 Body 中解析。
    /// </param>
    /// <returns>
    ///   - 如果登录成功，返回 `200 OK` 状态码和包含 JWT Token 及用户信息的 `AuthResponseDto`。
    ///   - 如果登录失败（例如用户名或密码错误），返回 `401 Unauthorized` 状态码和错误信息。
    /// </returns>
    // `[HttpPost("login")]`: HTTP Post 请求的路由特性。
    //   - `HttpPost`: 表示这个方法会响应 HTTP POST 请求。
    //   - `"login"`: 会附加到控制器根路由 `api/Auth` 后面。
    //     因此，这个方法的完整路由是 `POST /api/Auth/login`。
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        // 1. **调用认证服务进行登录验证**
        // `await authService.LoginAsync(dto)`: 调用注入的 `IAuthService` 实例的 `LoginAsync` 方法。
        // `LoginAsync` 会负责验证用户名和密码，并在成功时生成 JWT Token。
        var authResponse = await authService.LoginAsync(dto);

        // 2. **处理登录结果**
        // 如果 `authResponse` 为 `null`，表示 `LoginAsync` 返回登录失败。
        if (authResponse == null)
        {
            // `Unauthorized(...)`: 返回 `401 Unauthorized` HTTP 状态码。
            // 这是一个标准响应，表示请求因为缺乏有效的身份验证凭证而被拒绝。
            return Unauthorized(new { success = false, message = "用户名或密码错误" });
        }

        // 如果登录成功，返回 `200 OK` 状态码和 `AuthResponseDto`。
        // `AuthResponseDto` 包含了生成的 JWT Token 和一些基本的用户信息，供前端使用。
        return Ok(authResponse);
    }

    /// <summary>
    /// `Refresh` 方法用于刷新 JWT Token。
    /// 当 Access Token 过期时，客户端可以使用 Refresh Token 获取新的 Access Token。
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto dto)
    {
        var authResponse = await authService.RefreshTokenAsync(dto.RefreshToken);

        if (authResponse == null)
        {
            return BadRequest(new { success = false, message = "Token 无效或已过期" });
        }

        return Ok(authResponse);
    }
}
