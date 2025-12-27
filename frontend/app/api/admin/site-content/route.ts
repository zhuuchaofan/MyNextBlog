import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080';

// GET /api/admin/site-content - 获取所有配置
// GET /api/admin/site-content/[key] - 获取单个配置
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  const url = key 
    ? `${BACKEND_URL}/api/admin/site-content/${key}`
    : `${BACKEND_URL}/api/admin/site-content`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // 管理页面不使用缓存
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Site content fetch error:', error);
    return NextResponse.json(
      { success: false, message: '获取配置失败' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/site-content?key=xxx - 更新单个配置
export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ success: false, message: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const body = await request.json();

  // 单个更新
  if (key) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/site-content/${key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: body.value })
      });

      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(data, { status: res.status });
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error('Site content update error:', error);
      return NextResponse.json(
        { success: false, message: '更新配置失败' },
        { status: 500 }
      );
    }
  }

  // 批量更新
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/site-content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // 批量更新成功后，触发首页重新验证
    // 注意：这需要 Next.js 的 revalidatePath API
    // import { revalidatePath } from 'next/cache';
    // revalidatePath('/');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Site content batch update error:', error);
    return NextResponse.json(
      { success: false, message: '批量更新配置失败' },
      { status: 500 }
    );
  }
}
