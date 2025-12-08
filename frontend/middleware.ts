import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Intercept /api/backend requests (Proxy Logic Helper)
  // Note: We use next.config.ts rewrites for the actual routing, 
  // but we use Middleware to inject the Authorization header from the HttpOnly cookie.
  if (request.nextUrl.pathname.startsWith('/api/backend')) {
    const token = request.cookies.get('token')?.value;
    
    // Create new headers
    const requestHeaders = new Headers(request.headers);
    
    // If token exists, inject Authorization header
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }

    // Pass the modified headers to the next step (which is the rewrite)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // 2. Protect Admin Routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
     const token = request.cookies.get('token');
     if (!token) {
        // Redirect to login if no token found
        return NextResponse.redirect(new URL('/login', request.url));
     }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/backend/:path*', '/admin/:path*'],
};
