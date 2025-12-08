import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL || 'http://backend:5095';
  
  try {
      const res = await fetch(`${backendUrl}/api/account/me`, {
        headers: {
        'Authorization': `Bearer ${token.value}`
        }
      });

    if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ user: data }); 
    }
  } catch (e) {
      console.error(e);
  }
  
  return NextResponse.json({ user: null }, { status: 401 });
}
