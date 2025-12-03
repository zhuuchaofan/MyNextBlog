using Microsoft.AspNetCore.Mvc;
using MyTechBlog.Models;
using MyTechBlog.Services;

namespace MyTechBlog.Controllers;

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

    // 定义 DTO，确保 API 入参干净纯粹
    public record CreateCommentDto(int PostId, string Content, string? GuestName);
}