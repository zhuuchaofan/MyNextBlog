using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyTechBlog.Models;
using MyTechBlog.Services;

namespace MyTechBlog.Controllers.Api;

[Route("api/posts")] // URL: /api/posts
[ApiController]
public class PostsApiController(IPostService postService, ITagService tagService) : ControllerBase
{
    // GET: api/posts
    // 获取文章列表 (支持分页、搜索、分类)
    [HttpGet]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? search = null,
        [FromQuery] string? tag = null,
        [FromQuery] int? categoryId = null)
    {
        // 管理员可以看到隐藏文章
        bool isAdmin = User.IsInRole("Admin");
        
        // 1. 获取所有符合条件的文章
        var allPosts = await postService.GetAllPostsAsync(includeHidden: isAdmin, categoryId: categoryId, searchTerm: search, tagName: tag);

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
                p.CategoryId ?? 0,  // <--- 修复：处理 null 值
                p.Category?.Name,
                p.User?.Username,
                ExtractCoverImage(p.Content), // 提取封面图
                p.Tags.Select(t => t.Name).ToList() // Tags
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
                post.CategoryId ?? 0, // <--- 修复：处理 null 值
                post.Category?.Name,
                post.User?.Username,
                post.Comments?.Count ?? 0,
                ExtractCoverImage(post.Content), // <--- 新增：返回封面图
                post.Tags.Select(t => t.Name).ToList() // Tags
            )
        });
    }

    // DELETE: api/posts/5
    // 删除文章
    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
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

    // POST: api/posts
    // 创建文章
    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new { success = false, message = "标题不能为空" });

        var post = new Post
        {
            Title = dto.Title,
            Content = dto.Content ?? "",
            CategoryId = dto.CategoryId == 0 ? null : dto.CategoryId, // 0 表示未分类
            CreateTime = DateTime.Now,
            UserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0")
        };

        // 处理标签
        if (dto.Tags != null && dto.Tags.Length > 0)
        {
            post.Tags = await tagService.GetOrCreateTagsAsync(dto.Tags);
        }

        await postService.AddPostAsync(post);

        return Ok(new { success = true, message = "发布成功", postId = post.Id });
    }

    // PUT: api/posts/5
    // 更新文章
    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> UpdatePost(int id, [FromBody] CreatePostDto dto)
    {
        var post = await postService.GetPostByIdAsync(id);
        if (post == null) return NotFound(new { success = false, message = "文章不存在" });

        post.Title = dto.Title;
        post.Content = dto.Content ?? "";
        post.CategoryId = dto.CategoryId == 0 ? null : dto.CategoryId;
        
        // 更新标签
        post.Tags.Clear(); // 先清空现有标签
        if (dto.Tags != null && dto.Tags.Length > 0)
        {
            var newTags = await tagService.GetOrCreateTagsAsync(dto.Tags);
            post.Tags.AddRange(newTags);
        }

        await postService.UpdatePostAsync(post);
        return Ok(new { success = true, message = "更新成功" });
    }

    // === 辅助方法 ===

    // 从 Markdown 提取纯文本摘要
    private static string GetExcerpt(string content)
    {
        if (string.IsNullOrEmpty(content)) return "";

        // 1. 移除图片 (![alt](url)) -> 空
        var plain = System.Text.RegularExpressions.Regex.Replace(content, @"!\[.*?\]\(.*?\)", "");
        
        // 2. 移除代码块 (```...```) -> 空
        plain = System.Text.RegularExpressions.Regex.Replace(plain, @"```[\s\S]*?```", "", System.Text.RegularExpressions.RegexOptions.Multiline);
        
        // 3. 移除行内代码 (`code`) -> code
        plain = System.Text.RegularExpressions.Regex.Replace(plain, @"`([^`]+)`", "$1");

        // 4. 移除链接 ([text](url)) -> text
        plain = System.Text.RegularExpressions.Regex.Replace(plain, @"\[([^\]]+)\]\(.*?\)", "$1");

        // 5. 移除标题 (# Title) -> Title
        plain = System.Text.RegularExpressions.Regex.Replace(plain, @"^#+\s+", "", System.Text.RegularExpressions.RegexOptions.Multiline);

        // 6. 移除粗体/斜体 (**text**, *text*) -> text
        plain = System.Text.RegularExpressions.Regex.Replace(plain, @"(\*\*|__|\*|_)(.*?)\1", "$2");

        // 7. 移除引用 (> text) -> text
        plain = System.Text.RegularExpressions.Regex.Replace(plain, @"^>\s+", "", System.Text.RegularExpressions.RegexOptions.Multiline);

        // 8. 压缩空白字符 (多个换行/空格变一个空格)
        plain = System.Text.RegularExpressions.Regex.Replace(plain, @"\s+", " ").Trim();

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
    public record PostSummaryDto(int Id, string Title, string Excerpt, DateTime CreateTime, int CategoryId, string? Category, string? Author, string? CoverImage, List<string> Tags);
    
    public record PostDetailDto(int Id, string Title, string Content, DateTime CreateTime, int CategoryId, string? Category, string? Author, int CommentCount, string? CoverImage, List<string> Tags);

    public record CreatePostDto(
        [MaxLength(50, ErrorMessage = "标题不能超过50个字符")]
        string Title, 
        string Content, 
        int? CategoryId,
        string[]? Tags
    );
}