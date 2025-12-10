using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs; // Add this using statement
using MyNextBlog.Services; // Add this using statement

namespace MyNextBlog.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var authResponse = await authService.LoginAsync(dto);

        if (authResponse == null)
        {
            return Unauthorized(new { message = "用户名或密码错误" });
        }

        return Ok(authResponse);
    }
}