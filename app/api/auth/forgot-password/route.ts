import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';
import type { ForgotPasswordRequestBody, ApiResponse } from '@/types/auth';

// Consistent message regardless of whether user exists — prevents email enumeration
const SUCCESS_MSG =
  "If an account is registered with that email, you'll receive a password reset link shortly.";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as ForgotPasswordRequestBody;

    if (!email?.trim()) {
      return NextResponse.json<ApiResponse>({ error: 'Email is required.' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      const resetToken       = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken       = resetToken;
      user.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();
      await sendPasswordResetEmail(email.trim(), resetToken, user.firstName);
    }

    return NextResponse.json<ApiResponse>({ success: true, message: SUCCESS_MSG });
  } catch (err) {
    console.error('[api/auth/forgot-password]', err);
    return NextResponse.json<ApiResponse>({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
