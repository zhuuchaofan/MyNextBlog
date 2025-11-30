using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyTechBlog.Data;
using MyTechBlog.Models;
using BCrypt.Net;

namespace MyTechBlog.Controllers;

public class AccountController(AppDbContext context) : Controller
{
    // =====================
    // 注册部分
    // =====================

    // 1. 显示注册页面 (GET) <--- 之前可能丢了这个
    [HttpGet]
    public IActionResult Register()
    {
        return View();
    }

    // 2. 处理注册提交 (POST)
    [HttpPost]
    public async Task<IActionResult> Register(string username, string password)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            ViewBag.Error = "用户名和密码不能为空";
            return View();
        }

        if (await context.Users.AnyAsync(u => u.Username == username))
        {
            ViewBag.Error = "用户名已被占用";
            return View();
        }

        // 第一个注册的是 Admin，后续是 User
        bool isFirstUser = !await context.Users.AnyAsync();
        string role = isFirstUser ? "Admin" : "User";

        string passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        var user = new User
        {
            Username = username,
            PasswordHash = passwordHash,
            Role = role
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return RedirectToAction("Login");
    }

    // =====================
    // 登录部分
    // =====================

    // 3. 显示登录页面 (GET) <--- 导致 405 错误就是因为缺了这个！
    [HttpGet]
    public IActionResult Login()
    {
        return View();
    }

    // 4. 处理登录提交 (POST)
    [HttpPost]
    public async Task<IActionResult> Login(string username, string password, string returnUrl = "/")
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            ViewBag.Error = "请输入用户名和密码";
            return View();
        }

        var user = await context.Users.SingleOrDefaultAsync(u => u.Username == username);

        if (user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var claimsIdentity = new ClaimsIdentity(claims, "MyCookieAuth");
            await HttpContext.SignInAsync("MyCookieAuth", new ClaimsPrincipal(claimsIdentity));

            // 防止重定向攻击，或者默认跳回首页
            if (Url.IsLocalUrl(returnUrl))
                return LocalRedirect(returnUrl);
            else
                return RedirectToAction("Index", "Home");
        }

        ViewBag.Error = "用户名或密码错误";
        return View();
    }

    // =====================
    // 注销部分
    // =====================
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync("MyCookieAuth");
        return RedirectToAction("Index", "Home");
    }
}