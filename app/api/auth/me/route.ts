import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { ApiResponse } from '@/types/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('aura-auth')?.value;

  if (!token) {
    return NextResponse.json<ApiResponse>(
      { error: 'Not authenticated' },
      { status: 401 },
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json<ApiResponse>(
      { error: 'Session expired' },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    const user = await User.findById(payload.userId).select(
      'firstName lastName email phone role avatar addresses createdAt',
    );
    console.log(user, 'user');

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (err) {
    console.error('[api/auth/me]', err);
    return NextResponse.json<ApiResponse>(
      { error: 'Server error' },
      { status: 500 },
    );
  }
}
