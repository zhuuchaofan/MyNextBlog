using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Models;
using MyNextBlog.Services;

namespace MyNextBlog.Controllers.Api;

[Route("api/[controller]")]
[ApiController]
public class CommentsController(IPostService postService) : ControllerBase
{
    // 提交新评论
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCommentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new { success = false, message = "评论内容不能为空" });
        }

        var comment = new Comment
        {
            PostId = dto.PostId,
            Content = dto.Content,
            GuestName = string.IsNullOrWhiteSpace(dto.GuestName) ? "匿名访客" : dto.GuestName,
            CreateTime = DateTime.Now
        };

        await postService.AddCommentAsync(comment);

        // 返回成功状态和刚刚创建的评论对象（方便前端直接显示，不用重新查库）
        return Ok(new
        {
            success = true,
            comment = new
            {
                comment.Id,
                comment.GuestName,
                comment.Content,
                CreateTime = comment.CreateTime.ToString("yyyy/MM/dd HH:mm")
            }
        });
    }

    // 获取分页评论
    [HttpGet]
    public async Task<IActionResult> GetComments(int postId, int page = 1, int pageSize = 5)
    {
        var comments = await postService.GetCommentsAsync(postId, page, pageSize);
        var totalCount = await postService.GetCommentCountAsync(postId);
        
        // 是否还有更多？
        bool hasMore = (page * pageSize) < totalCount;

        return Ok(new
        {
            success = true,
            comments = comments.Select(c => new 
            {
                c.Id,
                c.GuestName,
                c.Content,
                CreateTime = c.CreateTime.ToString("yyyy/MM/dd HH:mm")
            }),
            hasMore
        });
    }

    // 定义 DTO，确保 API 入参干净纯粹
    public record CreateCommentDto(int PostId, string Content, string? GuestName);
}