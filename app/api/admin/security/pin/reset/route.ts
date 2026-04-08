import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import User from '@/models/User';
import { logSecurityEvent } from '@/models/SecurityLog';
import type { ApiResponse } from '@/types/auth';

// ── POST /api/admin/security/pin/reset ────────────────────────────────────────
// Clears the admin PIN after verifying the account password.
// Body: { password: string }

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { password } = body as { password?: string };

    if (!password) {
      return NextResponse.json<ApiResponse>(
        { error: 'Account password is required.' },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(admin.userId).select('+password +adminPin');
    if (!user) return NextResponse.json<ApiResponse>({ error: 'User not found.' }, { status: 404 });

    if (!user.adminPin) {
      return NextResponse.json<ApiResponse>(
        { error: 'No PIN is currently set.' },
        { status: 400 },
      );
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return NextResponse.json<ApiResponse>(
        { error: 'Password is incorrect.' },
        { status: 400 },
      );
    }

    await User.findByIdAndUpdate(admin.userId, { $unset: { adminPin: 1 } });

    await logSecurityEvent({
      event:       'pin_reset',
      description: 'Admin PIN was reset using account password',
      severity:    'warning',
      adminId:     admin.userId,
      adminName:   admin.email,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[api/admin/security/pin/reset POST]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
