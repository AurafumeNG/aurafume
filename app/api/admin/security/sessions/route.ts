import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { requireAdmin } from '@/lib/admin-auth';
import { logSecurityEvent } from '@/models/SecurityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/security/sessions ──────────────────────────────────────────
// Returns the current session info derived from the JWT cookie + request headers.
// (No persistent session store — stateless JWT.)

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const token = cookieStore.get('aura-admin-auth')?.value;

  let issuedAt: string | null = null;
  if (token) {
    try {
      const decoded = jwt.decode(token) as { iat?: number } | null;
      if (decoded?.iat) issuedAt = new Date(decoded.iat * 1000).toISOString();
    } catch {
      // ignore decode errors
    }
  }

  const userAgent = req.headers.get('user-agent') ?? 'Unknown';
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'Unknown';

  type SessionData = {
    sessions: { id: string; isCurrent: boolean; userAgent: string; ip: string; issuedAt: string | null; lastActive: string }[];
  };
  return NextResponse.json<ApiResponse<SessionData>>({
    success: true,
    data: {
      sessions: [
        {
          id:         'current',
          isCurrent:  true,
          userAgent,
          ip,
          issuedAt,
          lastActive: new Date().toISOString(),
        },
      ],
    },
  });
}

// ── DELETE /api/admin/security/sessions ───────────────────────────────────────
// Revokes the current session by clearing the auth cookie.
// Since JWTs are stateless there is no server-side session store,
// so only the current device is affected.

export async function DELETE() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  await logSecurityEvent({
    event:       'session_revoked_all',
    description: 'Admin signed out and revoked current session',
    severity:    'info',
    adminId:     admin.userId,
    adminName:   admin.email,
  });

  const response = NextResponse.json<ApiResponse>({ success: true });
  response.cookies.set('aura-admin-auth', '', {
    expires:  new Date(0),
    path:     '/',
    httpOnly: true,
    sameSite: 'strict',
    secure:   process.env.NODE_ENV === 'production',
  });

  return response;
}
