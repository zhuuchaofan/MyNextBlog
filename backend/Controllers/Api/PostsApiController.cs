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
    [HttpGet]
    public async Task<IActionResult> GetPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? search = null,
        [FromQuery] string? tag = null,
        [FromQuery] int? categoryId = null)
    {
        // 1. 权限判断
        // 如果用户已登录且角色是 Admin，则允许查看隐藏文章 (Drafts)
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        
        // 2. 调用服务获取数据 (Entity)
        // 这里的 includeHidden 参数决定了是否返回 IsHidden=true 的文章
        var allPosts = await postService.GetAllPostsAsync(includeHidden: isAdmin, categoryId: categoryId, searchTerm: search, tagName: tag);

        // 3. 计算分页元数据
        // 注意：目前采用内存分页 (先全查再Skip/Take)，适合个人博客的小数据量。
        // 数据量大时应重构为数据库分页。
        var totalCount = allPosts.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // 4. 执行分页切片并转换为 DTO
        // 使用 ToSummaryDto() 将实体转换为精简的传输对象，减少网络传输量
        var posts = allPosts
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => p.ToSummaryDto())
            .ToList();

        // 5. 返回标准响应结构
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
    [HttpGet("admin")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetAdminPosts(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        // 1. 直接获取所有文章 (强制 includeHidden = true)
        var allPosts = await postService.GetAllPostsAsync(includeHidden: true);

        // 2. 分页计算
        var totalCount = allPosts.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // 3. DTO 转换
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
    [HttpGet("admin/{id}")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Roles = "Admin")]
    public async Task<IActionResult> GetAdminPost(int id)
    {
        // 1. 获取详情 (允许隐藏文章)
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        if (post == null)
        {
            return NotFound(new { success = false, message = "文章不存在" });
        }
        
        // 2. 补充评论总数信息 (用于前端显示)
        var commentCount = await postService.GetCommentCountAsync(id);
        
        // 3. 返回完整详情 DTO
        return Ok(new { success = true, data = post.ToDetailDto(commentCount) });
    }

    /// <summary>
    /// 公开接口：获取文章详情
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPost(int id)
    {
        // 1. 确定权限上下文
        bool isAdmin = User.Identity?.IsAuthenticated == true && User.IsInRole("Admin");
        
        // 2. 获取详情 (根据权限过滤隐藏文章)
        var post = await postService.GetPostByIdAsync(id, includeHidden: isAdmin);
        
        if (post == null)
        {
            return NotFound(new { success = false, message = "文章不存在或已隐藏" });
        }

        // 3. 补充评论总数
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
        // 1. 获取当前登录用户 ID (从 Token Claims 中解析)
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdStr, out int userId)) userId = 0; 

        // 2. 构建文章实体
        var post = new Post
        {
            Title = dto.Title,
            Content = dto.Content,
            CategoryId = dto.CategoryId,
            UserId = userId > 0 ? userId : null,
            CreateTime = DateTime.Now
        };

        // 3. 处理标签关联
        // GetOrCreateTagsAsync 会自动处理标签去重和新建
        if (dto.Tags != null && dto.Tags.Any())
        {
            post.Tags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
        }

        // 4. 保存到数据库 (PostService 内部会处理图片关联)
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
        // 1. 检查文章是否存在
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        if (post == null) return NotFound(new { success = false, message = "文章不存在" });

        // 2. 更新基本字段
        post.Title = dto.Title;
        post.Content = dto.Content;
        post.CategoryId = dto.CategoryId;
        post.IsHidden = dto.IsHidden;

        // 3. 更新标签 (策略：先清空，再重新添加)
        post.Tags.Clear();
        if (dto.Tags != null && dto.Tags.Any())
        {
            var newTags = await tagService.GetOrCreateTagsAsync(dto.Tags.ToArray());
            post.Tags.AddRange(newTags);
        }

        // 4. 保存更改
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
        // 1. 验证存在性
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        if (post == null) return NotFound(new { success = false, message = "文章不存在" });

        // 2. 执行删除 (PostService 内部会处理级联删除逻辑)
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
        // 1. 执行切换
        var success = await postService.TogglePostVisibilityAsync(id);
        if (!success) return NotFound(new { success = false, message = "文章不存在" });

        // 2. 获取更新后的状态以返回给前端
        var post = await postService.GetPostByIdAsync(id, includeHidden: true);
        return Ok(new { success = true, message = "状态更新成功", isHidden = post?.IsHidden });
    }
}
