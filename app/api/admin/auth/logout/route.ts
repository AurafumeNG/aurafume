import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/auth';

export async function POST() {
  const res = NextResponse.json<ApiResponse>({ success: true });

  res.cookies.set('aura-admin-auth', '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   0,
    path:     '/',
  });

  return res;
}
