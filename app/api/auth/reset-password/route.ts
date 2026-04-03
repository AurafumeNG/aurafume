import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { ResetPasswordRequestBody, ApiResponse } from '@/types/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = (await req.json()) as ResetPasswordRequestBody;

    if (!token || !password) {
      return NextResponse.json<ApiResponse>({ error: 'Token and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({
      resetPasswordToken:       token,
      resetPasswordTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    user.password                 = password;
    user.resetPasswordToken       = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (err) {
    console.error('[api/auth/reset-password]', err);
    return NextResponse.json<ApiResponse>({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
