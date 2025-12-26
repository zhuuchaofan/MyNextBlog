using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Controllers.Api;

/// <summary>
/// 站点内容配置 API
/// 用于管理可动态配置的页面内容
/// </summary>
[ApiController]
[Route("api/site-content")]
public class SiteContentController(AppDbContext context) : ControllerBase
{
    /// <summary>
    /// 获取指定 Key 的内容（公开接口）
    /// </summary>
    [HttpGet("{key}")]
    public async Task<IActionResult> GetContent(string key)
    {
        var content = await context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Key == key);

        if (content == null)
        {
            return NotFound(new { success = false, message = $"未找到内容: {key}" });
        }

        return Ok(new { 
            success = true, 
            data = new {
                content.Key,
                content.Value,
                content.Description,
                content.UpdatedAt
            }
        });
    }

    /// <summary>
    /// 获取所有内容配置（管理员接口）
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllContent()
    {
        var contents = await context.SiteContents
            .AsNoTracking()
            .OrderBy(c => c.Key)
            .ToListAsync();

        return Ok(new { 
            success = true, 
            data = contents.Select(c => new {
                c.Key,
                c.Value,
                c.Description,
                c.UpdatedAt
            })
        });
    }

    /// <summary>
    /// 更新或创建内容配置（管理员接口）
    /// </summary>
    [HttpPut("{key}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateContent(string key, [FromBody] UpdateContentDto dto)
    {
        var content = await context.SiteContents.FirstOrDefaultAsync(c => c.Key == key);

        if (content == null)
        {
            // 不存在则创建
            content = new SiteContent
            {
                Key = key,
                Value = dto.Value,
                Description = dto.Description,
                UpdatedAt = DateTime.UtcNow
            };
            context.SiteContents.Add(content);
        }
        else
        {
            // 存在则更新
            content.Value = dto.Value;
            if (dto.Description != null)
            {
                content.Description = dto.Description;
            }
            content.UpdatedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync();

        return Ok(new { 
            success = true, 
            message = "内容已更新",
            data = new {
                content.Key,
                content.Value,
                content.Description,
                content.UpdatedAt
            }
        });
    }
}

/// <summary>
/// 更新内容的请求 DTO
/// </summary>
public record UpdateContentDto(string Value, string? Description);
