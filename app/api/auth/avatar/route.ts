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

// ── PATCH /api/auth/avatar — upload / replace ─────────────────────────────────
export async function PATCH(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { avatar } = (await req.json()) as { avatar?: string };

    if (!avatar || !avatar.startsWith('data:image/')) {
      return NextResponse.json<ApiResponse>({ error: 'Invalid image data.' }, { status: 400 });
    }

    // base64 size: length × 0.75 ≈ real bytes
    const approxBytes = Math.round((avatar.length * 3) / 4);
    if (approxBytes > 500_000) {
      return NextResponse.json<ApiResponse>(
        { error: 'Image too large. Please choose a smaller image.' },
        { status: 413 },
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { avatar },
      { new: true, select: 'avatar' },
    );

    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { avatar: user.avatar } });
  } catch (err) {
    console.error('[PATCH /api/auth/avatar]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE /api/auth/avatar — remove ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();
    await User.findByIdAndUpdate(payload.userId, { $unset: { avatar: '' } });
    return NextResponse.json({ success: true, data: { avatar: null } });
  } catch (err) {
    console.error('[DELETE /api/auth/avatar]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
