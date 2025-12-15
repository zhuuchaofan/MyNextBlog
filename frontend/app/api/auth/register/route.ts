import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
        
        cookieStore.set('token', data.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });
        
        return NextResponse.json({ 
            success: true, 
            user: data.user
        });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
      console.error("Register Proxy Error:", e);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
