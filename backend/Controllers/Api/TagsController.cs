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
        // 热门标签作为展示型数据，始终只统计公开文章，保持数据一致性
        var tags = await tagService.GetPopularTagsAsync(count, includeHidden: false);
        return Ok(new { success = true, data = tags.Select(t => t.Name) });
    }
}