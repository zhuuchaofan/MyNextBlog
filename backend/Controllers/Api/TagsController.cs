// ============================================================================
// Controllers/Api/TagsController.cs - 标签 API 控制器
// ============================================================================
// 此控制器提供文章标签相关的查询接口。
//
// **功能**: 获取热门标签 (按使用频率排序)

// `using` 语句用于导入必要的命名空间
using Microsoft.AspNetCore.Mvc;  // ASP.NET Core MVC
using MyNextBlog.Services;       // 业务服务

// `namespace` 声明了当前文件所属的命名空间
namespace MyNextBlog.Controllers.Api;

/// <summary>
/// `TagsController` 是标签模块的 API 控制器。
/// 
/// **路由**: `/api/tags`
/// **公开接口**: GET popular
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
        // 边界保护：限制返回数量范围
        count = Math.Clamp(count, 1, 50);
        
        // 热门标签作为展示型数据，始终只统计公开文章，保持数据一致性
        var tags = await tagService.GetPopularTagsAsync(count, includeHidden: false);
        return Ok(new { success = true, data = tags.Select(t => t.Name) });
    }
}