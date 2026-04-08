import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/models/AdminActivityLog';
import { sendPasswordResetEmail } from '@/lib/email';
import type { ApiResponse } from '@/types/auth';

type Params = { params: Promise<{ id: string }> };

// ── POST /api/admin/team/[id]/reset-password ──────────────────────────────────
// Send a password reset email to an admin (superadmin only)

export async function POST(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can reset team member passwords.' },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    await connectDB();

    const member = await User.findOne({
      _id:  id,
      role: { $in: ['admin', 'superadmin', 'viewer'] },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({ error: 'Team member not found.' }, { status: 404 });
    }

    const resetToken    = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(id, {
      resetPasswordToken:       resetToken,
      resetPasswordTokenExpiry: resetTokenExp,
    });

    await sendPasswordResetEmail(member.email, resetToken, member.firstName);

    await logAdminAction({
      adminId:    admin.userId,
      adminName:  admin.email,
      adminRole:  admin.role,
      action:     'reset_password',
      detail:     `Sent password reset to ${member.firstName} ${member.lastName} (${member.email})`,
      targetType: 'admin',
      targetId:   id,
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Password reset email sent to ${member.email}.`,
    });
  } catch (err) {
    console.error('[api/admin/team/[id]/reset-password]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
