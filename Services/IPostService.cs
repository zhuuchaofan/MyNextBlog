using MyTechBlog.Models;

namespace MyTechBlog.Services;

public interface IPostService
{
    // 定义这个服务能干什么
    Task<List<Post>> GetAllPostsAsync();
    Task<Post?> GetPostByIdAsync(int id);
    Task AddPostAsync(Post post);
    Task UpdatePostAsync(Post post);
    Task DeletePostAsync(int id);
    Task AddCommentAsync(Comment comment);
}