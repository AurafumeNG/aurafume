import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import User from '@/models/User';
import { logSecurityEvent } from '@/models/SecurityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/security/2fa ───────────────────────────────────────────────

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const user = await User.findById(admin.userId).select('+twoFaBackupCodes');
    if (!user) return NextResponse.json<ApiResponse>({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        enabled:         user.twoFaEnabled ?? false,
        hasBackupCodes:  (user.twoFaBackupCodes?.length ?? 0) > 0,
      },
    });
  } catch (err) {
    console.error('[api/admin/security/2fa GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/security/2fa ─────────────────────────────────────────────
// Body: { action: 'disable'; password: string }
// Enabling 2FA requires TOTP dependencies (speakeasy / qrcode) — not yet installed.

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { action, password } = body as { action?: string; password?: string };

    if (action === 'enable') {
      return NextResponse.json<ApiResponse>(
        { error: 'Two-factor authentication setup requires TOTP configuration. Install required dependencies first.' },
        { status: 501 },
      );
    }

    if (action === 'disable') {
      if (!password) {
        return NextResponse.json<ApiResponse>(
          { error: 'Account password is required to disable 2FA.' },
          { status: 400 },
        );
      }

      await connectDB();
      const user = await User.findById(admin.userId).select('+password');
      if (!user) return NextResponse.json<ApiResponse>({ error: 'User not found.' }, { status: 404 });

      if (!user.twoFaEnabled) {
        return NextResponse.json<ApiResponse>(
          { error: '2FA is not currently enabled.' },
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

      await User.findByIdAndUpdate(admin.userId, {
        $set:   { twoFaEnabled: false },
        $unset: { twoFaSecret: 1, twoFaBackupCodes: 1 },
      });

      await logSecurityEvent({
        event:       'two_fa_disabled',
        description: 'Two-factor authentication disabled',
        severity:    'warning',
        adminId:     admin.userId,
        adminName:   admin.email,
      });

      return NextResponse.json<ApiResponse>({ success: true });
    }

    return NextResponse.json<ApiResponse>({ error: 'Invalid action.' }, { status: 400 });
  } catch (err) {
    console.error('[api/admin/security/2fa PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
