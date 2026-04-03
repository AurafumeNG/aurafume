import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { ApiResponse } from '@/types/auth';

function auth(req: NextRequest) {
  const token = req.cookies.get('aura-auth')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── PATCH /api/auth/profile ────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { firstName, lastName, phone } =
      (await req.json()) as { firstName?: string; lastName?: string; phone?: string };

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json<ApiResponse>(
        { error: 'First name and last name are required.' },
        { status: 400 },
      );
    }

    await connectDB();

    const update: Record<string, string | undefined> = {
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
    };
    // Allow clearing phone by sending empty string
    if (phone !== undefined) {
      update.phone = phone.trim() || undefined;
    }

    const user = await User.findByIdAndUpdate(payload.userId, update, {
      new:    true,
      select: 'firstName lastName email phone role avatar createdAt',
    });

    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    console.error('[PATCH /api/auth/profile]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
