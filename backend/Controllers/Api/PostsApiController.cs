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

/// <summary>
/// 文章管理控制器
/// 提供博客文章的查询（公开/管理）、发布、更新和删除接口
/// </summary>
[Route("api/posts")]
[ApiController]
public class PostsApiController(IPostService postService, ITagService tagService) : ControllerBase
{
    /// <summary>
    /// 公开接口：获取文章列表
    /// </summary>
    /// <param name="page">当前页码 (默认1)</param>
    /// <param name="pageSize">每页条数 (默认10)</param>
    /// <param name="search">搜索关键词 (可选)</param>
    /// <param name="tag">按标签筛选 (可选)</param>
    /// <param name="categoryId">按分类筛选 (可选)</param>
    /// <remarks>
    /// 普通用户只能看到 IsHidden=false 的文章。
    /// 如果是 Admin 登录用户，系统会自动包含隐藏文章。
    /// </remarks>
    [HttpGet]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? search = null,
        [FromQuery] string? tag = null,
        [FromQuery] int? categoryId = null)
    {
        // 检查当前用户是否为管理员
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        
        // 获取原始数据 (Entity)
        var allPosts = await postService.GetAllPostsAsync(includeHidden: isAdmin, categoryId: categoryId, searchTerm: search, tagName: tag);

        // 计算分页元数据
        // 注意：目前采用内存分页 (先全查再Skip/Take)，适合个人博客的小数据量。
        // 数据量大时应重构为数据库分页。
        var totalCount = allPosts.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // 执行分页并转换为 DTO
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

    /// <summary>
    /// 管理员接口：获取文章列表（包含隐藏文章）
    /// </summary>
    /// <remarks>
    /// 专门供后台管理界面使用，强制包含隐藏文章。
    /// </remarks>
    [HttpGet("admin")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetAdminPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
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

    /// <summary>
    /// 管理员接口：获取文章详情
    /// </summary>
    /// <param name="id">文章 ID</param>
    /// <remarks>
    /// 可以访问任意状态的文章（包括已隐藏的）。
    /// </remarks>
    [HttpGet("admin/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetAdminPost(int id)
    {
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        if (post == null)
        {
            return NotFound(new { success = false, message = "文章不存在" });
        }
        
        // 补充评论总数信息
        var commentCount = await postService.GetCommentCountAsync(id);
        
        return Ok(new { success = true, data = post.ToDetailDto(commentCount) });
    }

    /// <summary>
    /// 公开接口：获取文章详情
    /// </summary>
    /// <param name="id">文章 ID</param>
    /// <remarks>
    /// 如果文章被隐藏且当前用户不是管理员，将返回 404。
    /// </remarks>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPost(int id)
    {
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        var post = await postService.GetPostByIdAsync(id, includeHidden: isAdmin);
        
        if (post == null)
        {
            return NotFound(new { success = false, message = "文章不存在或已隐藏" });
        }

        // 补充评论总数信息
        var commentCount = await postService.GetCommentCountAsync(id);

        return Ok(new { success = true, data = post.ToDetailDto(commentCount) });
    }

    /// <summary>
    /// 管理员接口：发布新文章
    /// </summary>
    [HttpPost]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto dto)
    {
        // 获取当前登录用户 ID
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId)) userId = 0; 

        var post = new Post
        {
            Title = dto.Title,
            Content = dto.Content,
            CategoryId = dto.CategoryId,
            UserId = userId > 0 ? userId : null,
            CreateTime = DateTime.Now
        };

        // 处理标签关联
        if (dto.Tags != null && dto.Tags.Any())
        {
            post.Tags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
        }

        await postService.AddPostAsync(post);
        return Ok(new { success = true, message = "发布成功", postId = post.Id, data = post.ToDetailDto() });
    }

    /// <summary>
    /// 管理员接口：更新文章
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto dto)
    {
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        if (post == null) return NotFound(new { success = false, message = "文章不存在" });

        // 更新基本信息
        post.Title = dto.Title;
        post.Content = dto.Content;
        post.CategoryId = dto.CategoryId;
        post.IsHidden = dto.IsHidden;

        // 更新标签 (先清空再重新添加)
        post.Tags.Clear();
        if (dto.Tags != null && dto.Tags.Any())
        {
            var newTags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
            post.Tags.AddRange(newTags);
        }

        await postService.UpdatePostAsync(post);
        return Ok(new { success = true, message = "更新成功", data = post.ToDetailDto() });
    }

    /// <summary>
    /// 管理员接口：删除文章
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        if (post == null) return NotFound(new { success = false, message = "文章不存在" });

        await postService.DeletePostAsync(id);
        return Ok(new { success = true, message = "删除成功" });
    }

    /// <summary>
    /// 管理员接口：切换文章可见性 (快捷操作)
    /// </summary>
    [HttpPatch("{id}/visibility")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> ToggleVisibility(int id)
    {
        var success = await postService.TogglePostVisibilityAsync(id);
        if (!success) return NotFound(new { success = false, message = "文章不存在" });

        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        return Ok(new { success = true, message = "状态更新成功", isHidden = post?.IsHidden });
    }
}