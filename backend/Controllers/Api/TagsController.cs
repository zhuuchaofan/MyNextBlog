using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 标签控制器
/// </summary>
[Route("api/tags")]
[ApiController]
public class TagsController(ITagService tagService) : ControllerBase
{
    /// <summary>
    /// 获取热门标签
    /// </summary>
    /// <param name="count">返回数量 (默认10)</param>
    /// <returns>按使用频率排序的标签名称列表</returns>
    [HttpGet("popular")]
    public async Task<IActionResult> GetPopular(int count = 10)
    {
        // 判断当前用户是否为管理员
        // 注意：此接口允许匿名访问，User 可能为空或未认证，这没关系
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");

        var tags = await tagService.GetPopularTagsAsync(count, includeHidden: isAdmin);
        return Ok(new { success = true, data = tags.Select(t => t.Name) });
    }
}