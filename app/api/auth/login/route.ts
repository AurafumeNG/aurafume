import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/auth';

const COOKIE  = 'aura-auth';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days (seconds)

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as { email: string; password: string };

    if (!email?.trim() || !password) {
      return NextResponse.json<ApiResponse>({ error: 'Email and password are required.' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      // Same message for both "no user" and "wrong password" — prevents email enumeration
      return NextResponse.json<ApiResponse>({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json<ApiResponse>(
        { error: 'Please verify your email address before logging in. Check your inbox.' },
        { status: 403 },
      );
    }

    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role });

    const res = NextResponse.json<ApiResponse<{ firstName: string; email: string; role: string }>>({
      success: true,
      data:    { firstName: user.firstName, email: user.email, role: user.role },
    });

    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   MAX_AGE,
      path:     '/',
    });

    return res;
  } catch (err) {
    console.error('[api/auth/login]', err);
    return NextResponse.json<ApiResponse>({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
