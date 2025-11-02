import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.AUTH_SECRET || 'your-secret-key-change-in-production';

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, new TextEncoder().encode(SECRET_KEY));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/users'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/users');

  // Handle root path
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/chat', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protect authenticated routes (chat, etc.)
  if (pathname.startsWith('/chat')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}


