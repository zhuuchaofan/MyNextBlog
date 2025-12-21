using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.DTOs;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

[Route("api/series")]
[ApiController]
public class SeriesApiController(ISeriesService seriesService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAllSeries()
    {
        var series = await seriesService.GetAllSeriesAsync();
        return Ok(new { success = true, data = series });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSeriesById(int id)
    {
        var series = await seriesService.GetSeriesByIdAsync(id);
        if (series == null)
            return NotFound(new { success = false, message = "系列不存在" });

        return Ok(new { success = true, data = series });
    }

    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> CreateSeries([FromBody] CreateSeriesDto dto)
    {
        var series = await seriesService.CreateSeriesAsync(dto);
        return Ok(new { success = true, message = "创建成功", data = series });
    }

    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> UpdateSeries(int id, [FromBody] UpdateSeriesDto dto)
    {
        try
        {
            var series = await seriesService.UpdateSeriesAsync(id, dto);
            return Ok(new { success = true, message = "更新成功", data = series });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> DeleteSeries(int id)
    {
        await seriesService.DeleteSeriesAsync(id);
        return Ok(new { success = true, message = "删除成功" });
    }

    [HttpGet("{id}/next-order")]
    public async Task<IActionResult> GetNextOrder(int id)
    {
        var nextOrder = await seriesService.GetNextOrderAsync(id);
        return Ok(new { success = true, data = nextOrder });
    }

    /// <summary>
    /// 获取系列下的所有文章（公开接口，游客只能看公开文章）
    /// </summary>
    [HttpGet("{id}/posts")]
    public async Task<IActionResult> GetSeriesPosts(int id)
    {
        // 检查系列是否存在
        var series = await seriesService.GetSeriesByIdAsync(id);
        if (series == null)
            return NotFound(new { success = false, message = "系列不存在" });

        // 判断是否为管理员（有权看隐藏文章）
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        
        var posts = await seriesService.GetSeriesPostsAsync(id, includeHidden: isAdmin);
        return Ok(new { success = true, data = posts });
    }
}
