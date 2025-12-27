import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/auth/logout
// --------------------------------------------------------------------------------
// 这是一个用于处理“登出”操作的 Route Handler。
//
// **核心逻辑**:
// 由于 Token 是存储在 HttpOnly Cookie 中的，前端 JavaScript 无法直接删除它。
// 因此，前端需要请求这个 API 路由，由服务端来执行删除 Cookie 的操作。
export async function POST() {
  const cookieStore = await cookies();
  
  // 删除名为 'token' 的 Cookie
  // 这会向浏览器发送一个 Set-Cookie 头，将过期时间设置为过去的时间，从而使 Cookie 失效。
  cookieStore.delete('token');
  cookieStore.delete('refresh_token');
  
  return NextResponse.json({ success: true });
}
