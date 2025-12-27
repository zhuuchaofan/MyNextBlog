import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:5095';

// GET /api/admin/stats/dashboard
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/stats/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    return NextResponse.json(
      { success: false, message: '获取统计失败' },
      { status: 500 }
    );
  }
}
