using System.Security.Claims;

namespace MyNextBlog.Extensions;

/// <summary>
/// ClaimsPrincipal 扩展方法
/// 用于从 JWT Claims 中提取用户信息，消除控制器中的重复代码
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// 判断当前用户是否为管理员
    /// </summary>
    /// <param name="user">当前用户的 ClaimsPrincipal</param>
    /// <returns>true 如果用户已认证且角色为 Admin</returns>
    public static bool IsAdmin(this ClaimsPrincipal user)
    {
        return user.Identity?.IsAuthenticated == true && user.IsInRole("Admin");
    }
    
    /// <summary>
    /// 判断当前用户是否已认证
    /// </summary>
    /// <param name="user">当前用户的 ClaimsPrincipal</param>
    /// <returns>true 如果用户已认证</returns>
    public static bool IsAuthenticated(this ClaimsPrincipal user)
    {
        return user.Identity?.IsAuthenticated == true;
    }
    
    /// <summary>
    /// 从 JWT Claims 中获取当前用户 ID
    /// </summary>
    /// <returns>用户 ID，如果解析失败则返回 null</returns>
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var userIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdStr, out var id) ? id : null;
    }
}
