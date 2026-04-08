import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import User from '@/models/User';
import { logSecurityEvent } from '@/models/SecurityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/security/pin ───────────────────────────────────────────────
// Returns whether the current admin has a PIN set.

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const user = await User.findById(admin.userId).select('+adminPin');
    return NextResponse.json<ApiResponse<{ pinSet: boolean }>>({ success: true, data: { pinSet: !!user?.adminPin } });
  } catch (err) {
    console.error('[api/admin/security/pin GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/security/pin ─────────────────────────────────────────────
// Change or set PIN.
// Body: { currentPin?: string; newPin: string }
// If a PIN is already set, currentPin is required.

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { currentPin, newPin } = body as { currentPin?: string; newPin?: string };

    if (!newPin || !/^\d{6}$/.test(newPin)) {
      return NextResponse.json<ApiResponse>(
        { error: 'New PIN must be exactly 6 digits.' },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(admin.userId).select('+adminPin');
    if (!user) return NextResponse.json<ApiResponse>({ error: 'User not found.' }, { status: 404 });

    const hadPin = !!user.adminPin;

    if (hadPin) {
      if (!currentPin) {
        return NextResponse.json<ApiResponse>(
          { error: 'Current PIN is required.' },
          { status: 400 },
        );
      }
      const valid = await bcrypt.compare(String(currentPin), user.adminPin!);
      if (!valid) {
        return NextResponse.json<ApiResponse>(
          { error: 'Current PIN is incorrect.' },
          { status: 400 },
        );
      }
    }

    user.adminPin = await bcrypt.hash(newPin, 12);
    await user.save();

    await logSecurityEvent({
      event:       'pin_changed',
      description: hadPin ? 'Admin PIN changed' : 'Admin PIN set for the first time',
      severity:    'info',
      adminId:     admin.userId,
      adminName:   admin.email,
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[api/admin/security/pin PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
