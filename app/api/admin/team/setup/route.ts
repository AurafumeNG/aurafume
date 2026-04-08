import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/team/setup?token= ─────────────────────────────────────────
// Validate invite token and return the invitee's first name + email so the
// setup page can greet them by name before they set a password.

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json<ApiResponse>({ error: 'Missing token.' }, { status: 400 });
  }

  try {
    await connectDB();

    const user = await User.findOne({
      inviteToken:        token,
      inviteTokenExpires: { $gt: new Date() },
      isVerified:         false,
    }).select('firstName email role');

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { error: 'This invitation link is invalid or has expired.' },
        { status: 400 },
      );
    }

    return NextResponse.json<ApiResponse<{ firstName: string; email: string; role: string }>>({
      success: true,
      data: {
        firstName: user.firstName,
        email:     user.email,
        role:      user.role,
      },
    });
  } catch (err) {
    console.error('[api/admin/team/setup GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/admin/team/setup ────────────────────────────────────────────────
// Accept the invite: set password, mark verified, clear the invite token.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { token?: string; password?: string };
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json<ApiResponse>(
        { error: 'Token and password are required.' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({
      inviteToken:        token,
      inviteTokenExpires: { $gt: new Date() },
      isVerified:         false,
    }).select('+password');

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { error: 'This invitation link is invalid or has expired.' },
        { status: 400 },
      );
    }

    user.password            = password; // pre-save hook hashes it
    user.isVerified          = true;
    user.inviteToken         = undefined;
    user.inviteTokenExpires  = undefined;
    await user.save();

    return NextResponse.json<ApiResponse<{ email: string }>>({
      success: true,
      message: 'Account activated. You can now sign in.',
      data:    { email: user.email },
    });
  } catch (err) {
    console.error('[api/admin/team/setup POST]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
