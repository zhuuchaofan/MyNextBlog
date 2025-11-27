using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;

namespace MyTechBlog.Controllers;

public class AccountController : Controller
{
    // GET: /Account/Login
    public IActionResult Login()
    {
        return View();
    }

    // POST: /Account/Login
    [HttpPost]
    public async Task<IActionResult> Login(string username, string password, string returnUrl = "/")
    {
        // 这里先用“硬编码”校验，后期我们可以改成查 Users 表
        // 账号: admin, 密码: 123456
        if (username == "admin" && password == "123456")
        {
            // 1. 创建身份证 (Claims)
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, "Admin")
            };

            // 2. 创建证件照 (Identity)
            var claimsIdentity = new ClaimsIdentity(claims, "MyCookieAuth");

            // 3. 签发 Cookie (SignIn)
            await HttpContext.SignInAsync("MyCookieAuth", new ClaimsPrincipal(claimsIdentity));

            // 4. 登录成功，跳回之前的页面
            return LocalRedirect(returnUrl);
        }

        // 登录失败
        ViewBag.Error = "用户名或密码错误";
        return View();
    }

    // GET: /Account/Logout
    public async Task<IActionResult> Logout()
    {
        // 销毁 Cookie
        await HttpContext.SignOutAsync("MyCookieAuth");
        return RedirectToAction("Index", "Home");
    }
}