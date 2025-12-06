using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Models;
using MyNextBlog.Services;
using MyNextBlog.DTOs;
using MyNextBlog.Extensions;
using System.Security.Claims;

namespace MyNextBlog.Controllers.Api;

[Route("api/posts")]
[ApiController]
public class PostsApiController(IPostService postService, ITagService tagService) : ControllerBase
{
    // GET: api/posts
    [HttpGet]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? search = null,
        [FromQuery] string? tag = null,
        [FromQuery] int? categoryId = null)
    {
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        
        var allPosts = await postService.GetAllPostsAsync(includeHidden: isAdmin, categoryId: categoryId, searchTerm: search, tagName: tag);

        var totalCount = allPosts.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var posts = allPosts
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => p.ToSummaryDto())
            .ToList();

        return Ok(new
        {
            success = true,
            data = posts,
            meta = new { page, pageSize, totalCount, totalPages, hasMore = page < totalPages }
        });
    }

    // GET: api/posts/admin
    // 专门给管理员用的列表接口
    [HttpGet("admin")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetAdminPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        // 既然进来了，肯定是 Admin，直接 includeHidden = true
        var allPosts = await postService.GetAllPostsAsync(includeHidden: true);

        var totalCount = allPosts.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var posts = allPosts
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => p.ToSummaryDto())
            .ToList();

        return Ok(new
        {
            success = true,
            data = posts,
            meta = new { page, pageSize, totalCount, totalPages, hasMore = page < totalPages }
        });
    }

    // GET: api/posts/admin/5
    // 专门给管理员用的详情接口，无视 IsHidden
    [HttpGet("admin/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetAdminPost(int id)
    {
        var post = await postService.GetPostByIdAsync(id);
        if (post == null)
        {
            return NotFound(new { success = false, message = "文章不存在" });
        }
        // 管理员可以直接获取，不需要判断 IsHidden
        return Ok(new { success = true, data = post.ToDetailDto() });
    }

    // GET: api/posts/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPost(int id)
    {
        var post = await postService.GetPostByIdAsync(id);
        
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        
        if (post == null || (post.IsHidden && !isAdmin))
        {
            return NotFound(new { success = false, message = "文章不存在或已隐藏" });
        }

        return Ok(new { success = true, data = post.ToDetailDto() });
    }

    // POST: api/posts
    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId)) userId = 0; // Default/System user

        var post = new Post
        {
            Title = dto.Title,
            Content = dto.Content,
            CategoryId = dto.CategoryId,
            UserId = userId > 0 ? userId : null,
            CreateTime = DateTime.Now
        };

        if (dto.Tags != null && dto.Tags.Any())
        {
            post.Tags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
        }

        await postService.AddPostAsync(post);
        return Ok(new { success = true, message = "发布成功", postId = post.Id, data = post.ToDetailDto() });
    }

    // PUT: api/posts/5
    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto dto)
    {
        var post = await postService.GetPostByIdAsync(id);
        if (post == null) return NotFound(new { success = false, message = "文章不存在" });

        post.Title = dto.Title;
        post.Content = dto.Content;
        post.CategoryId = dto.CategoryId;
        post.IsHidden = dto.IsHidden;

        // 更新标签
        post.Tags.Clear();
        if (dto.Tags != null && dto.Tags.Any())
        {
            var newTags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
            post.Tags.AddRange(newTags);
        }

        await postService.UpdatePostAsync(post);
        return Ok(new { success = true, message = "更新成功", data = post.ToDetailDto() });
    }

    // DELETE: api/posts/5
    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var post = await postService.GetPostByIdAsync(id);
        if (post == null) return NotFound(new { success = false, message = "文章不存在" });

        await postService.DeletePostAsync(id);
        return Ok(new { success = true, message = "删除成功" });
    }

    // PATCH: api/posts/5/visibility
    [HttpPatch("{id}/visibility")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> ToggleVisibility(int id)
    {
        var success = await postService.TogglePostVisibilityAsync(id);
        if (!success) return NotFound(new { success = false, message = "文章不存在" });

        // 获取更新后的状态以返回
        var post = await postService.GetPostByIdAsync(id);
        return Ok(new { success = true, message = "状态更新成功", isHidden = post?.IsHidden });
    }
}
