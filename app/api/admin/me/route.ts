import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';
import type { ApiResponse } from '@/types/auth';

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('aura-admin-auth')?.value;

  if (!token) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'superadmin')) {
    return NextResponse.json<ApiResponse>({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId).select(
      'firstName lastName email role avatar',
    );
    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json<ApiResponse<{
      firstName: string;
      lastName:  string;
      email:     string;
      role:      string;
      avatar?:   string;
    }>>({
      success: true,
      data: {
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        role:      user.role,
        avatar:    user.avatar,
      },
    });
  } catch (err) {
    console.error('[api/admin/me]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
