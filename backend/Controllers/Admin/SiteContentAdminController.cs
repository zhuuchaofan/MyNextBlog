using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Controllers.Admin;

/// <summary>
/// 站点内容配置管理 API (仅管理员可访问)
/// </summary>
[ApiController]
[Route("api/admin/site-content")]
[Authorize(Roles = "Admin")]
public class SiteContentAdminController(AppDbContext context) : ControllerBase
{
    /// <summary>
    /// 获取所有配置项
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var contents = await context.SiteContents
            .OrderBy(c => c.Key)
            .Select(c => new
            {
                c.Key,
                c.Description,
                c.Value,
                c.UpdatedAt
            })
            .ToListAsync();

        return Ok(new { success = true, data = contents });
    }

    /// <summary>
    /// 获取单个配置项
    /// </summary>
    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key)
    {
        var content = await context.SiteContents
            .FirstOrDefaultAsync(c => c.Key == key);

        if (content == null)
        {
            return NotFound(new { success = false, message = "配置项不存在" });
        }

        return Ok(new
        {
            success = true,
            data = new
            {
                content.Key,
                content.Description,
                content.Value,
                content.UpdatedAt
            }
        });
    }

    /// <summary>
    /// 更新配置项
    /// </summary>
    [HttpPut("{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateContentRequest request)
    {
        var content = await context.SiteContents
            .FirstOrDefaultAsync(c => c.Key == key);

        if (content == null)
        {
            return NotFound(new { success = false, message = "配置项不存在" });
        }

        content.Value = request.Value;
        content.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "更新成功",
            data = new
            {
                content.Key,
                content.Value,
                content.UpdatedAt
            }
        });
    }

    /// <summary>
    /// 批量更新配置项
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> BatchUpdate([FromBody] BatchUpdateRequest request)
    {
        var keys = request.Updates.Select(u => u.Key).ToList();
        var contents = await context.SiteContents
            .Where(c => keys.Contains(c.Key))
            .ToListAsync();

        var updateTime = DateTime.UtcNow;
        foreach (var update in request.Updates)
        {
            var content = contents.FirstOrDefault(c => c.Key == update.Key);
            if (content != null)
            {
                content.Value = update.Value;
                content.UpdatedAt = updateTime;
            }
        }

        await context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"成功更新 {contents.Count} 个配置项",
            updatedCount = contents.Count
        });
    }
}

// DTO Models
public record UpdateContentRequest(string Value);

public record BatchUpdateRequest(List<ConfigUpdate> Updates);

public record ConfigUpdate(string Key, string Value);
