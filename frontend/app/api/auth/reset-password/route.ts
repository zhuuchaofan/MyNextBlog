import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';

  try {
    const res = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
      console.error("Reset Password Proxy Error:", e);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
