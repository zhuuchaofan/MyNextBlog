import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, COOKIE_OPTIONS } from '@/lib/auth-config';
import { refreshTokenSingleton } from '@/lib/tokenRefresh';

/**
 * Next.js Middleware
 * 职责：1. 为 /api/backend 注入 Authorization 头；2. 保护 /admin 路由；3. 自动刷新过期 Token
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let accessToken = request.cookies.get('token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const isApiRoute = pathname.startsWith('/api/backend');
  const isProtectedPage = pathname.startsWith('/admin');

  // 非目标路由，直接放行
  if (!isApiRoute && !isProtectedPage) {
    return NextResponse.next();
  }

  // Token 过期检测
  const isExpired = accessToken ? isTokenExpired(accessToken) : true;

  // Token 刷新逻辑：使用单例刷新函数避免并发请求
  let newAccessToken: string | null = null;
  let newRefreshToken: string | null = null;

  if ((!accessToken || isExpired) && refreshToken) {
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
    
    const result = await refreshTokenSingleton(accessToken, refreshToken, backendUrl);
    if (result.success && result.accessToken && result.refreshToken) {
      newAccessToken = result.accessToken;
      newRefreshToken = result.refreshToken;
      accessToken = newAccessToken;
    }
  }

  // 管理员页面拦截
  if (!accessToken && isProtectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 构造响应并注入 Authorization 头
  const requestHeaders = new Headers(request.headers);
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // 写回新 Cookie
  if (newAccessToken && newRefreshToken) {
    response.cookies.set('token', newAccessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
    response.cookies.set('refresh_token', newRefreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });
  }

  return response;
}

/** 检查 JWT 是否过期（提前 30 秒） */
function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp < (Math.floor(Date.now() / 1000) + 30);
  } catch {
    return true;
  }
}

export const config = {
  matcher: ['/api/backend/:path*', '/admin/:path*'],
};
