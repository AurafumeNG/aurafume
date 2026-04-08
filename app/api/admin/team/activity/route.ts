import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminActivityLog from '@/models/AdminActivityLog';
import { requireAdmin } from '@/lib/admin-auth';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/team/activity ──────────────────────────────────────────────
// Paginated admin activity log with filters

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page       = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
  const limit      = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
  const adminId    = searchParams.get('adminId')    ?? '';
  const actionType = searchParams.get('actionType') ?? '';
  const dateFrom   = searchParams.get('dateFrom')   ?? '';
  const dateTo     = searchParams.get('dateTo')     ?? '';

  try {
    await connectDB();

    // ── Build filter ──
    const filter: Record<string, unknown> = {};

    if (adminId)    filter.adminId = adminId;
    if (actionType) filter.action  = actionType;

    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        dateFilter.$lte = to;
      }
      filter.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      AdminActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminActivityLog.countDocuments(filter),
    ]);

    // ── Unique admins for filter dropdown ──
    const admins = await AdminActivityLog.distinct('adminId');
    const adminNames = await AdminActivityLog.aggregate([
      { $group: { _id: '$adminId', name: { $first: '$adminName' }, role: { $first: '$adminRole' } } },
      { $sort:  { name: 1 } },
    ]);

    // ── Unique action types for filter dropdown ──
    const actionTypes = await AdminActivityLog.distinct('action');

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        logs: logs.map((l) => ({
          _id:       l._id.toString(),
          adminId:   l.adminId,
          adminName: l.adminName,
          adminRole: l.adminRole,
          action:    l.action,
          detail:    l.detail,
          targetType: l.targetType ?? null,
          targetId:   l.targetId  ?? null,
          createdAt:  (l.createdAt as Date).toISOString(),
        })),
        total,
        page,
        pages:      Math.ceil(total / limit),
        adminList:  adminNames,
        actionList: actionTypes.sort(),
      },
    });
  } catch (err) {
    console.error('[api/admin/team/activity GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
