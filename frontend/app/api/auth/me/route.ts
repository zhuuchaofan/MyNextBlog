import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// GET /api/auth/me
// --------------------------------------------------------------------------------
// 这个路由用于在前端页面加载时检查用户的登录状态（Session Check）。
//
// **核心逻辑**:
// 1. 读取浏览器发送的 HttpOnly Cookie。
// 2. 如果没有 Token，说明未登录。
// 3. 如果有 Token，则取出并构造 Authorization 头，代理请求后端的 `/api/account/me` 接口。
// 4. 如果后端验证 Token 有效并返回用户信息，则将其转发给前端。
export async function GET() {
  const cookieStore = await cookies();
  let token = cookieStore.get('token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  // 确定后端地址
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';

  // 1. 如果没有 AccessToken 但有 RefreshToken，尝试直接刷新
  // 或者有 AccessToken 但可能已过期（这里简单起见，如果请求失败再刷新）
  if (!token && !refreshToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
      // 2. 尝试请求后端用户信息
      let res = await fetch(`${backendUrl}/api/account/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });

      // 3. 如果返回 401 (Unauthorized) 且我们有 RefreshToken，尝试刷新
      if (res.status === 401 && refreshToken) {
          console.log("[Auth/Me] Token expired, attempting refresh...");
          const refreshRes = await fetch(`${backendUrl}/api/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: token || "", refreshToken: refreshToken }),
          });

          if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              token = refreshData.token;
              const newRefreshToken = refreshData.refreshToken;

              // 刷新成功后，用新 Token 再次请求用户信息
              res = await fetch(`${backendUrl}/api/account/me`, {
                  headers: {
                      'Authorization': `Bearer ${token}`
                  }
              });
              
              if (res.ok) {
                  const userData = await res.json();
                  // 构造响应，并写入新的 Cookie
                  const response = NextResponse.json({ user: userData });
                  
                  response.cookies.set('token', token!, {
                      httpOnly: true,
                      secure: process.env.NODE_ENV === 'production',
                      path: '/',
                      sameSite: 'lax',
                      maxAge: 15 * 60 // 15 min
                  });

                  response.cookies.set('refresh_token', newRefreshToken, {
                      httpOnly: true,
                      secure: process.env.NODE_ENV === 'production',
                      path: '/',
                      sameSite: 'lax',
                      maxAge: 7 * 24 * 60 * 60 // 7 days
                  });

                  console.log("[Auth/Me] Refresh successful, cookies updated.");
                  return response;
              }
          } else {
              console.warn("[Auth/Me] Refresh failed.");
          }
      }

    // 4. 常规成功响应 (Token 有效)
    if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ user: data }); 
    }
  } catch (e) {
      console.error("Session Check Error:", e);
  }
  
  // 5. 失败兜底
  return NextResponse.json({ user: null }, { status: 401 });
}
