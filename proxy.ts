// proxy.ts  (renamed from middleware.ts — Next.js 16 convention)
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const ADMIN_COOKIE     = 'aura-admin-auth';
const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_SETUP_PATH = '/admin/setup';
const ADMIN_ROOT       = '/admin';

// Routes under /admin that don't require an active session
const PUBLIC_ADMIN_PATHS = [ADMIN_LOGIN_PATH, ADMIN_SETUP_PATH];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only intercept /admin routes
  if (!pathname.startsWith(ADMIN_ROOT)) return NextResponse.next();

  const token   = req.cookies.get(ADMIN_COOKIE)?.value;
  const payload = token ? verifyToken(token) : null;
  const isAdmin = payload?.role === 'admin' || payload?.role === 'superadmin';

  // Already authenticated — skip the login page
  if (isAdmin && pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.redirect(new URL(ADMIN_ROOT, req.url));
  }

  // Protected admin route — require valid admin session
  if (!isAdmin && !PUBLIC_ADMIN_PATHS.includes(pathname)) {
    const url = new URL(ADMIN_LOGIN_PATH, req.url);
    if (pathname !== ADMIN_ROOT) url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
