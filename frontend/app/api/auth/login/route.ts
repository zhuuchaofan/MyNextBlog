import { NextResponse } from 'next/server'; // Next.js 用于构建 HTTP 响应的工具
import { cookies } from 'next/headers';     // Next.js 用于在服务端操作 Cookie 的工具

// POST /api/auth/login
// --------------------------------------------------------------------------------
// 这是一个 Next.js Route Handler（路由处理程序）。
// 它的作用是充当 BFF (Backend for Frontend) 层，处理登录请求。
//
// **核心逻辑**:
// 1. 接收前端提交的用户名和密码。
// 2. 在服务端向真实的后端 API 发起登录请求。
// 3. 登录成功后，获取后端返回的 JWT Token。
// 4. **关键步骤**: 将 Token 写入到浏览器的 HttpOnly Cookie 中。
//    - HttpOnly: JS 无法读取，防止 XSS 攻击窃取 Token。
//    - Secure: 生产环境只允许 HTTPS 传输。
// 5. 向前端返回用户信息，但**不返回** Token 本身。
export async function POST(request: Request) {
  // 解析请求体中的 JSON 数据 (包含 username, password)
  const body = await request.json();
  
  // 确定后端地址 (Docker 网络内部地址)
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';

  try {
    // 代理请求：向后端 API 发送登录请求
    const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    // 解析后端返回的数据 (AuthResponseDto: token, username, role, expiration)
    const data = await res.json();

    if (res.ok) {
        // **设置 Cookie**
        // 获取 Cookie 存储对象
        const cookieStore = await cookies();
        
        // 设置名为 'token' 的 Cookie
        cookieStore.set('token', data.token, {
            httpOnly: true, // 禁止客户端 JavaScript 访问 (安全核心)
            secure: process.env.NODE_ENV === 'production', // 仅在生产环境强制 HTTPS
            path: '/', // Cookie 在整个网站有效
            maxAge: 60 * 60 * 24 * 7, // 有效期 7 天 (单位：秒)
        });
        
        // **安全响应**
        // 返回给前端的数据中**剔除**了 Token。
        // 前端只需要知道“登录成功”以及“我是谁”，不需要持有 Token。
        // 之后的请求会自动由浏览器带上 HttpOnly Cookie。
        return NextResponse.json({ 
            success: true, 
            username: data.username, 
            role: data.role 
        });
    }

    // 如果登录失败，原样返回后端的错误信息
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
      console.error("Login Proxy Error:", e);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
