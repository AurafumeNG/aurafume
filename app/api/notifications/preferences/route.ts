import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { ApiResponse } from '@/types/auth';
import type { INotificationPreferences } from '@/models/User';

function auth(req: NextRequest) {
  const token = req.cookies.get('aura-auth')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── GET /api/notifications/preferences ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId).select('notificationPreferences');
    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: user.notificationPreferences });
  } catch (err) {
    console.error('[GET /api/notifications/preferences]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}

// ── PATCH /api/notifications/preferences ──────────────────────────────────────
// Body: { path: 'email.orderUpdates', value: true }
// path is a dot-notation key within notificationPreferences
export async function PATCH(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { path, value } = (await req.json()) as { path?: string; value?: boolean };

    if (!path || typeof value !== 'boolean') {
      return NextResponse.json<ApiResponse>(
        { error: 'path (string) and value (boolean) are required.' },
        { status: 400 },
      );
    }

    // Whitelist allowed paths to prevent arbitrary DB writes
    const ALLOWED: Array<keyof INotificationPreferences['email'] | keyof INotificationPreferences['push'] | string> = [
      'email.orderUpdates', 'email.promotions', 'email.newArrivals',
      'email.restockedItems', 'email.newsletter',
      'push.enabled', 'push.orderStatusChanges', 'push.flashSales', 'push.deliveryUpdates',
    ];
    if (!ALLOWED.includes(path)) {
      return NextResponse.json<ApiResponse>({ error: 'Invalid preference path.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      payload.userId,
      { $set: { [`notificationPreferences.${path}`]: value } },
      { new: true, select: 'notificationPreferences' },
    );

    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user.notificationPreferences });
  } catch (err) {
    console.error('[PATCH /api/notifications/preferences]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
