import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import SecurityLog from '@/models/SecurityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/security/log ───────────────────────────────────────────────
// Paginated security event log.
// Query params: page (default 1), limit (default 20, max 50),
//               event (filter by event type), severity (filter by severity)

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, Number(searchParams.get('page')  ?? 1));
  const limit    = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const event    = searchParams.get('event');
  const severity = searchParams.get('severity');

  try {
    await connectDB();

    const filter: Record<string, unknown> = {};
    if (event)    filter.event    = event;
    if (severity) filter.severity = severity;

    const [logs, total] = await Promise.all([
      SecurityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SecurityLog.countDocuments(filter),
    ]);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        logs,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[api/admin/security/log GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
