import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, COOKIE_OPTIONS } from "@/lib/auth-config";

/**
 * POST /api/auth/login
 * BFF 登录代理：接收前端凭证，调用后端，将 Token 写入 HttpOnly Cookie。
 */
export async function POST(request: Request) {
  const body = await request.json();
  const backendUrl = process.env.BACKEND_URL || "http://backend:8080";

  try {
    const res = await fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      const cookieStore = await cookies();

      // Access Token
      cookieStore.set("token", data.token, {
        ...COOKIE_OPTIONS,
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      // Refresh Token
      if (data.refreshToken) {
        cookieStore.set("refresh_token", data.refreshToken, {
          ...COOKIE_OPTIONS,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        });
      }

      // 返回用户信息（不含 Token）
      return NextResponse.json({
        success: true,
        username: data.user.username,
        role: data.user.role,
        avatarUrl: data.user.avatarUrl,
        nickname: data.user.nickname,
        bio: data.user.bio,
        website: data.user.website,
        location: data.user.location,
        occupation: data.user.occupation,
        birthDate: data.user.birthDate,
        email: data.user.email,
      });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("Login Proxy Error:", e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
