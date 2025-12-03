using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyTechBlog.Models;
using MyTechBlog.Services;

namespace MyTechBlog.Controllers.Api;

[Route("api/posts")] // URL: /api/posts
[ApiController]
public class PostsApiController(IPostService postService) : ControllerBase
{
    // GET: api/posts
    // 获取文章列表 (支持分页、搜索、分类)
    [HttpGet]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null)
    {
        // 1. 获取所有符合条件的文章 (目前 Service 层还没做专门的分页查询，先查出来再内存分页)
        // 优化建议：将来在 IPostService 里加一个 GetPostsPagedAsync 方法直接数据库分页
        var allPosts = await postService.GetAllPostsAsync(includeHidden: false, categoryId: categoryId, searchTerm: search);

        var totalCount = allPosts.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var posts = allPosts
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PostSummaryDto(
                p.Id,
                p.Title,
                GetExcerpt(p.Content), // 提取摘要
                p.CreateTime,
                p.Category?.Name,
                p.User?.Username,
                ExtractCoverImage(p.Content) // 提取封面图
            ))
            .ToList();

        return Ok(new
        {
            success = true,
            data = posts,
            meta = new
            {
                page,
                pageSize,
                totalCount,
                totalPages,
                hasMore = page < totalPages
            }
        });
    }

    // GET: api/posts/5
    // 获取文章详情
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPost(int id)
    {
        var post = await postService.GetPostByIdAsync(id);

        if (post == null || post.IsHidden)
        {
            return NotFound(new { success = false, message = "文章不存在或已隐藏" });
        }

        return Ok(new
        {
            success = true,
            data = new PostDetailDto(
                post.Id,
                post.Title,
                post.Content,
                post.CreateTime,
                post.Category?.Name,
                post.User?.Username,
                post.Comments?.Count ?? 0
            )
        });
    }

    // DELETE: api/posts/5
    // 删除文章
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var post = await postService.GetPostByIdAsync(id);
        if (post == null)
        {
            return NotFound(new { success = false, message = "文章不存在" });
        }

        await postService.DeletePostAsync(id);
        return Ok(new { success = true, message = "删除成功" });
    }

    // === 辅助方法 ===

    // 从 Markdown 提取纯文本摘要
    private static string GetExcerpt(string content)
    {
        if (string.IsNullOrEmpty(content)) return "";
        // 简单去除 Markdown 符号
        var plain = System.Text.RegularExpressions.Regex.Replace(content, "[#*`>]", "");
        return plain.Length > 150 ? plain.Substring(0, 150) + "..." : plain;
    }

    // 从 Markdown 提取第一张图片作为封面
    private static string? ExtractCoverImage(string content)
    {
        if (string.IsNullOrEmpty(content)) return null;
        var match = System.Text.RegularExpressions.Regex.Match(content, @"!\[.*?\]\((.*?)\)");
        return match.Success ? match.Groups[1].Value : null;
    }

    // === DTO 定义 ===
    public record PostSummaryDto(int Id, string Title, string Excerpt, DateTime CreateTime, string? Category, string? Author, string? CoverImage);
    
    public record PostDetailDto(int Id, string Title, string Content, DateTime CreateTime, string? Category, string? Author, int CommentCount);
}