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
  const token = cookieStore.get('token');

  // 如果 Cookie 中没有 Token，直接返回未登录状态
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // 确定后端地址
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  
  try {
      // 代理请求：带着 Token 去问后端“我是谁？”
      const res = await fetch(`${backendUrl}/api/account/me`, {
        headers: {
            // 将 Cookie 中的 token 值放入 Authorization 头中
            'Authorization': `Bearer ${token.value}`
        }
      });

    // 如果后端验证成功
    if (res.ok) {
        const data = await res.json();
        // 返回用户信息给前端
        return NextResponse.json({ user: data }); 
    }
  } catch (e) {
      console.error("Session Check Error:", e);
  }
  
  // 如果后端返回错误（Token 过期/无效）或发生异常，视为未登录
  return NextResponse.json({ user: null }, { status: 401 });
}
