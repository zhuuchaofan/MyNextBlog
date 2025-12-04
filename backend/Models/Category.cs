namespace MyTechBlog.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // 分类名称，比如“技术”、“生活”

    // 关系：一个分类下有一堆文章
    public List<Post> Posts { get; set; } = new List<Post>();
}