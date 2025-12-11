import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 后端 API 基础 URL。
// 注意：在 Edge Runtime (Vercel) 中，环境变量需要特殊配置。
// 在本地 Docker 环境中，`http://backend:8080` 或 `http://localhost:5095` 可能会根据您的配置有所不同。
const BACKEND_API_URL = process.env.BACKEND_URL || 'http://backend:8080';

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // --- 1. 处理 /api/backend/ 请求的认证和刷新 ---
  if (currentPath.startsWith('/api/backend')) {
    let accessToken = request.cookies.get('token')?.value; // 注意 Cookie 名是 'token'
    const refreshToken = request.cookies.get('refreshToken')?.value;

    // 如果没有 AccessToken，但有 RefreshToken，尝试刷新
    if (!accessToken && refreshToken) {
      try {
        const refreshRes = await fetch(`${BACKEND_API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }), // 后端 RefreshTokenDto 字段名是 refreshToken
        });

        if (refreshRes.ok) {
          const newAuthData = await refreshRes.json();
          accessToken = newAuthData.accessToken; // 获取新的 AccessToken
          const newRefreshToken = newAuthData.refreshToken; // 获取新的 RefreshToken

          // 更新 AccessToken Cookie
          response.cookies.set('token', accessToken, { // Cookie 名是 'token'
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 15 * 60, // 15 分钟
          });

          // 更新 RefreshToken Cookie
          response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 天
          });

          // 将新的 AccessToken 注入到当前请求的 Headers 中
          response.request.headers.set('Authorization', `Bearer ${accessToken}`);
        } else {
          // 刷新失败（Refresh Token 无效或过期），需要重新登录
          // 清除所有认证 Cookie
          response.cookies.delete('token');
          response.cookies.delete('refreshToken');
          // 如果是 /admin 路由，则重定向到登录页
          if (currentPath.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login', request.url));
          }
          // 对于非 /admin 路由，允许继续，后端会返回 401
        }
      } catch (error) {
        console.error('Refresh Token failed in middleware:', error);
        // 刷新接口本身出错，也清除 Cookie
        response.cookies.delete('token');
        response.cookies.delete('refreshToken');
        if (currentPath.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
      }
    } else if (accessToken) {
      // 如果有 AccessToken (且是有效的，没有过期，或者 Middleware 不去管是否过期)
      response.request.headers.set('Authorization', `Bearer ${accessToken}`);
    } else if (!accessToken && !refreshToken && currentPath.startsWith('/admin')) {
        // 没有 AccessToken 也没有 RefreshToken，且是 /admin 路由，重定向到登录
        return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // --- 2. 保护管理员路由（如果上面没有处理） ---
  // 这部分逻辑可以放在上面，但为了清晰分开
  if (currentPath.startsWith('/admin') && !request.cookies.has('token')) { // 检查 AccessToken
    // 如果 AccessToken 仍不存在 (意味着没有登录或刷新失败)，重定向到登录
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

// 配置匹配器
export const config = {
  matcher: ['/api/backend/:path*', '/admin/:path*'],
};
