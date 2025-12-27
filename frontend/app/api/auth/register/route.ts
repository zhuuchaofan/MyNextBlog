import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, COOKIE_OPTIONS } from '@/lib/auth-config';

/**
 * POST /api/auth/register
 * BFF 注册代理：注册成功后自动登录，将 Token 写入 HttpOnly Cookie。
 */
export async function POST(request: Request) {
  const body = await request.json();
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';

  try {
    const res = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      const cookieStore = await cookies();
      const authData = data.data; // 后端返回 { success: true, data: AuthResponseDto }

      // Access Token
      cookieStore.set('token', authData.token, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      // Refresh Token
      if (authData.refreshToken) {
        cookieStore.set('refresh_token', authData.refreshToken, {
          ...COOKIE_OPTIONS,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        });
      }

      return NextResponse.json({ success: true, user: authData });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Register Proxy Error:", e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
