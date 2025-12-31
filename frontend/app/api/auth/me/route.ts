import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, COOKIE_OPTIONS } from '@/lib/auth-config';
import { refreshTokenSingleton } from '@/lib/tokenRefresh';

/**
 * GET /api/auth/me
 * 检查用户登录状态。如果 Access Token 失效但 Refresh Token 有效，则自动刷新。
 * 使用 refreshTokenSingleton 避免并发刷新问题。
 */
export async function GET() {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';

  if (!token && !refreshToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    // 尝试获取用户信息
    let res = await fetch(`${backendUrl}/api/account/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // 如果 401 且有 Refresh Token，尝试刷新（使用单例刷新避免并发）
    if (res.status === 401 && refreshToken) {
      const refreshResult = await refreshTokenSingleton(token, refreshToken, backendUrl);

      if (refreshResult.success && refreshResult.accessToken) {
        token = refreshResult.accessToken;

        // 用新 Token 重试
        res = await fetch(`${backendUrl}/api/account/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const userData = await res.json();
          const response = NextResponse.json({ user: userData });

          // 更新 Cookies
          response.cookies.set('token', token!, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE });
          response.cookies.set('refresh_token', refreshResult.refreshToken!, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE });

          return response;
        }
      }
    }

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ user: data });
    }
  } catch (e) {
    console.error("Session Check Error:", e);
  }

  return NextResponse.json({ user: null }, { status: 401 });
}
