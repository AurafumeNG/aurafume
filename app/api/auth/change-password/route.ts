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

// ── POST /api/auth/change-password ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } =
      (await req.json()) as { currentPassword?: string; newPassword?: string };

    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse>(
        { error: 'Both current and new passwords are required.' },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json<ApiResponse>(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json<ApiResponse>(
        { error: 'New password must be different from your current password.' },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId).select('+password provider');
    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    if (user.provider === 'google' || !user.password) {
      return NextResponse.json<ApiResponse>(
        { error: 'Your account uses Google Sign-In. Password change is not available.' },
        { status: 400 },
      );
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json<ApiResponse>(
        { error: 'Current password is incorrect.' },
        { status: 400 },
      );
    }

    user.password = newPassword;
    await user.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    console.error('[POST /api/auth/change-password]', err);
    return NextResponse.json<ApiResponse>(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
