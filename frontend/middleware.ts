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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 获取 Tokens
  let accessToken = request.cookies.get('token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // 2. 定义是否需要保护或代理的路由
  const isApiRoute = pathname.startsWith('/api/backend');
  const isProtectedPage = pathname.startsWith('/admin');

  // 如果不是目标路由，直接放行 (为了性能)
  if (!isApiRoute && !isProtectedPage) {
     return NextResponse.next();
  }

  // 3. Token 刷新逻辑
  // 触发条件：Access Token 缺失 (过期)，但 Refresh Token 存在
  let newAccessToken: string | null = null;
  let newRefreshToken: string | null = null;
  let responseToReturn: NextResponse | null = null;

  if (!accessToken && refreshToken) {
    try {
        console.log(`[Middleware] Access Token expired, attempting refresh... Path: ${pathname}`);
        
        // 调用后端刷新接口
        // 注意：中间件中无法直接使用 process.env.BACKEND_URL (通常为 undefined 或需要特殊配置)
        // 且中间件运行在 Edge Runtime，fetch 是原生的。
        // 这里假设 backend 服务名在 Docker 网络中可用，或者使用 localhost 
        // 生产环境通常需要完整的 URL。
        // *关键*: 在 Docker Compose 内部网络中，Next.js 中间件(运行在 Node) 可以访问 http://backend:8080
        const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
        
        const refreshRes = await fetch(`${backendUrl}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: "", refreshToken: refreshToken }), // DTO 要求 AccessToken, 但过期了也没事，传空或旧的? DTO其实只校验Refresh即查库。
        });

        if (refreshRes.ok) {
            const data = await refreshRes.json();
            newAccessToken = data.token;
            newRefreshToken = data.refreshToken;
            
            // 刷新成功！更新当前作用域的 accessToken，以便后续流程使用
            accessToken = newAccessToken!;
            console.log("[Middleware] Token refresh successful.");
        } else {
            console.warn("[Middleware] Token refresh failed:", refreshRes.status);
            // 刷新失败 (比如 Refresh Token 也过期了) -> 视为未登录 -> 继续往下走会触发重定向
        }
    } catch (error) {
        console.error("[Middleware] Token refresh error:", error);
    }
  }

  // 4. Access Token 校验与拦截
  // 如果经过尝试刷新后，仍然没有有效的 accessToken
  if (!accessToken) {
      if (isProtectedPage) {
          // 拦截管理员页面 -> 去登录
          const url = request.nextUrl.clone();
          url.pathname = '/login';
          url.searchParams.set('from', request.nextUrl.pathname); // 记录跳转前地址
          return NextResponse.redirect(url);
      }
      if (isApiRoute) {
          // 拦截 API 请求 -> 返回 401
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
  }

  // 5. 构造响应 (注入 Header + 更新 Cookie)
  
  // 必须先调用 next() 来获取基础响应对象
  // 并在 request header 中注入最新的 Token (供后端或 Server Components 使用)
  const requestHeaders = new Headers(request.headers);
  if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  responseToReturn = NextResponse.next({
      request: {
          headers: requestHeaders,
      },
  });

  // 如果发生了刷新，需要在响应中写回新的 Cookie
  if (newAccessToken && newRefreshToken) {
      responseToReturn.cookies.set('token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          sameSite: 'lax',
          maxAge: 15 * 60, // 15 min
      });
      
      responseToReturn.cookies.set('refresh_token', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60, // 7 days
      });
  }

  return responseToReturn;
}

// 配置匹配器
export const config = {
  matcher: ['/api/backend/:path*', '/admin/:path*'],
};
