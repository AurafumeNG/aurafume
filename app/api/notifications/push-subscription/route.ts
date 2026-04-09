import { NextRequest, NextResponse } from 'next/server';
import { verifyToken }              from '@/lib/jwt';
import connectDB                    from '@/lib/mongodb';
import PushSubscription             from '@/models/PushSubscription';
import type { ApiResponse }         from '@/types/auth';

function auth(req: NextRequest) {
  const token = req.cookies.get('aura-auth')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── POST — register a new push subscription ───────────────────────────────────
export async function POST(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json<ApiResponse>(
      { error: 'endpoint, keys.p256dh and keys.auth are required.' },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    // Upsert so re-subscribing the same endpoint is idempotent
    await PushSubscription.findOneAndUpdate(
      { endpoint: body.endpoint },
      {
        userId:    payload.userId,
        endpoint:  body.endpoint,
        keys:      { p256dh: body.keys.p256dh, auth: body.keys.auth },
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
      { upsert: true, new: true },
    );

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[POST /api/notifications/push-subscription]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE — remove a push subscription ──────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json<ApiResponse>({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json<ApiResponse>({ error: 'endpoint is required.' }, { status: 400 });
  }

  try {
    await connectDB();
    await PushSubscription.deleteOne({ endpoint: body.endpoint, userId: payload.userId });
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[DELETE /api/notifications/push-subscription]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
