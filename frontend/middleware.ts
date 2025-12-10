import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 中间件 (Middleware)
// --------------------------------------------------------------------------------
// 这是一个运行在 Next.js 服务边缘（Edge Runtime）的轻量级函数。
// 它会在请求到达具体的页面或 API 路由**之前**执行。
//
// 本项目的中间件主要有两个核心职责：
// 1. **认证代理 (Auth Proxy)**: 拦截前端对 `/api/backend` 的请求，自动注入 Authorization 头。
// 2. **路由保护 (Route Protection)**: 保护 `/admin` 开头的路由，防止未登录用户访问。

export function middleware(request: NextRequest) {
  // 1. 拦截后端 API 请求 (API 代理逻辑辅助)
  // 注意：实际的 URL 重写 (Rewrite) 是在 `next.config.ts` 中配置的，
  // 但中间件在这里负责**注入身份凭证**。
  if (request.nextUrl.pathname.startsWith('/api/backend')) {
    // 从 Cookie 中读取 Token (HttpOnly Cookie 安全性高，JS 无法读取，但浏览器会自动发送给同源请求)
    const token = request.cookies.get('token')?.value;
    
    // 创建一个新的 Headers 对象，以便修改请求头
    const requestHeaders = new Headers(request.headers);
    
    // 如果 Cookie 中存在 Token，则手动添加 'Authorization' 头
    // 格式为: Bearer <token_string>
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    // NextResponse.next(): 允许请求继续传递到下一步（即 next.config.ts 中的 rewrite 规则）。
    // 我们将修改后的 headers 传递下去。
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // 2. 保护管理员路由
  // 任何访问 `/admin` 开头的 URL 都需要检查是否已登录。
  if (request.nextUrl.pathname.startsWith('/admin')) {
     const token = request.cookies.get('token');
     
     // 如果没有 Token (未登录)，则强制重定向到登录页面。
     if (!token) {
        // 创建重定向 URL，指向 /login
        return NextResponse.redirect(new URL('/login', request.url));
     }
     // 注意：这里只做了“是否登录”的初步检查。
     // 具体的“是否是管理员”权限检查，仍然由后端 API (通过 [Authorize(Roles="Admin")]) 把关。
     // 即使恶意用户伪造了 Token 绕过这里，后端也会拒绝请求。
  }
  
  // 对于其他无需处理的请求，直接放行。
  return NextResponse.next();
}

// 配置匹配器
// 指定中间件只对以下路径生效，避免影响静态资源（图片、CSS等）的加载速度。
export const config = {
  matcher: ['/api/backend/:path*', '/admin/:path*'],
};
