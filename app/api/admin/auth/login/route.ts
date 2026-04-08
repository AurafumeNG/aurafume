import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';
import { checkRateLimit, recordFailedAttempt, resetAttempts } from '@/lib/admin-rate-limit';
import type { ApiResponse } from '@/types/auth';

const COOKIE  = 'aura-admin-auth';
const MAX_AGE = 8 * 60 * 60; // 8 hours — shorter TTL than customer sessions (7d)

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // ── Rate limit check ────────────────────────────────────────────────────────
  const limit = checkRateLimit(ip);
  if (limit.blocked) {
    const minutes = Math.ceil(limit.retryAfterSecs! / 60);
    return NextResponse.json<ApiResponse>(
      { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSecs) } },
    );
  }

  try {
    const body = await req.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json<ApiResponse>(
        { error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // Deliberately use a single error message for wrong credentials AND wrong role
    // to prevent account enumeration or role disclosure.
    const credsFailed = !user || !(await user.comparePassword(password));

    const isAdminRole = user?.role === 'admin' || user?.role === 'superadmin';
    if (credsFailed || !isAdminRole) {
      const result = recordFailedAttempt(ip);
      const remaining = result.remaining;
      const hint = remaining > 0 ? ` (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)` : '';
      return NextResponse.json<ApiResponse>(
        { error: `Invalid credentials.${hint}` },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json<ApiResponse>(
        { error: 'This account has not been verified.' },
        { status: 403 },
      );
    }

    // ── Successful login ─────────────────────────────────────────────────────
    resetAttempts(ip);

    // Track last login time (fire-and-forget; never block the login response)
    User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).catch(() => {});

    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role });

    const res = NextResponse.json<ApiResponse<{ firstName: string; email: string }>>({
      success: true,
      data: { firstName: user.firstName, email: user.email },
    });

    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict', // stricter than customer sessions ('lax')
      maxAge:   MAX_AGE,
      path:     '/',  // must cover /api/admin/* routes, not just /admin/* page routes
    });

    return res;
  } catch (err) {
    console.error('[api/admin/auth/login]', err);
    return NextResponse.json<ApiResponse>(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
