using Microsoft.AspNetCore.Mvc;
using MyNextBlog.Models;
using MyNextBlog.Services; // 引用服务层
using Microsoft.AspNetCore.Authorization;

namespace MyNextBlog.Controllers;

public class PostsController(IPostService postService) : Controller
{
    // 1. 只有这一位“厨师”，没有 _context 了

    // GET: Posts
    public async Task<IActionResult> Index(int? categoryId, string? search)
    {
        // 只有管理员能看到隐藏文章
        bool isAdmin = User.IsInRole("Admin");
        
        // 吩咐厨师：把所有菜端上来 (带过滤)
        var posts = await postService.GetAllPostsAsync(includeHidden: isAdmin, categoryId: categoryId, searchTerm: search);

        // 如果选了分类，把分类名字查出来放在 ViewData 里，方便页面显示
        if (categoryId.HasValue)
        {
            var categories = await postService.GetCategoriesAsync();
            var currentCategory = categories.FirstOrDefault(c => c.Id == categoryId.Value);
            ViewData["CurrentCategory"] = currentCategory?.Name;
            ViewData["CurrentCategoryId"] = categoryId;
        }
        
        // 如果有搜索词，传回前端
        ViewData["CurrentSearch"] = search;

        return View(posts);
    }

    // GET: Posts/Details/5
    public async Task<IActionResult> Details(int? id)
    {
        if (id == null) return NotFound();

        // 吩咐厨师：按 ID 查这道菜 (此时没有评论数据)
        // 只有管理员能看到隐藏文章
        bool isAdmin = User.IsInRole("Admin");
        var post = await postService.GetPostByIdAsync(id.Value, includeHidden: isAdmin);

        if (post == null) return NotFound();
        
        // 手动加载第一页评论 (5条)
        post.Comments = await postService.GetCommentsAsync(post.Id, 1, 5);
        
        // 查总数，传给 View 用于显示 "X 评论"
        ViewData["TotalCommentCount"] = await postService.GetCommentCountAsync(post.Id);

        return View(post);
    }

    // GET: Posts/Create
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create()
    {
        // 获取所有分类，存进 ViewBag
        ViewBag.Categories = await postService.GetCategoriesAsync();
        return View();
    }

    // POST: Posts/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([Bind("Title,Content,CategoryId,IsHidden")] Post post)
    {
        if (ModelState.IsValid)
        {
            // 从 Claims 中获取当前登录用户的 ID
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                post.UserId = userId;
            }

            post.CreateTime = DateTime.Now;
            // 吩咐厨师：做一道新菜
            await postService.AddPostAsync(post);
            return RedirectToAction(nameof(Index));
        }
        return View(post);
    }

    // GET: Posts/Edit/5
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Edit(int? id)
    {
        if (id == null) return NotFound();

        var post = await postService.GetPostByIdAsync(id.Value, includeHidden: true);
        if (post == null) return NotFound();
        ViewBag.Categories = await postService.GetCategoriesAsync(); // 获取所有分类
        return View(post);
    }

    // POST: Posts/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Edit(int id, [Bind("Id,Title,Content,CreateTime,CategoryId,IsHidden")] Post post)
    {
        if (id != post.Id) return NotFound();

        if (ModelState.IsValid)
        {            // 从 Claims 中获取当前登录用户的 ID
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                post.UserId = userId;
            }
            // post.EditTime =  DateTime.Now;  之后加一个修改时间
            // 吩咐厨师：修改这道菜
            await postService.UpdatePostAsync(post);
            return RedirectToAction(nameof(Index)); // 这里通常回列表，或者回 Details
        }
        return View(post);
    }

    // POST: Posts/Delete/5
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        // 吩咐厨师：倒掉这道菜
        await postService.DeletePostAsync(id);
        return RedirectToAction(nameof(Index));
    }

    // POST: Posts/AddComment
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AddComment(int postId, string content, string guestName)
    {
        if (string.IsNullOrWhiteSpace(content)) return RedirectToAction("Details", new { id = postId });

        var comment = new Comment
        {
            PostId = postId,
            Content = content,
            GuestName = string.IsNullOrWhiteSpace(guestName) ? "匿名访客" : guestName,
            CreateTime = DateTime.Now
        };

        // 吩咐厨师：加个配菜（评论）
        await postService.AddCommentAsync(comment);

        return RedirectToAction("Details", new { id = postId });
    }
}