import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import AdminShippingSettings, { getShippingSettings } from '@/models/AdminShippingSettings';
import { logAdminAction } from '@/models/AdminActivityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/settings/shipping ─────────────────────────────────────────

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const settings = await getShippingSettings();
    return NextResponse.json<ApiResponse>({ success: true, data: settings });
  } catch (err) {
    console.error('[api/admin/settings/shipping GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PUT /api/admin/settings/shipping ─────────────────────────────────────────
// Replaces the full methods array (superadmin only).

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can modify shipping settings.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json() as { methods?: unknown };

    if (!Array.isArray(body.methods)) {
      return NextResponse.json<ApiResponse>(
        { error: '`methods` must be an array.' },
        { status: 400 },
      );
    }

    // Basic per-item validation
    for (const m of body.methods as Record<string, unknown>[]) {
      if (!m.id || !m.type || !['delivery', 'pickup'].includes(m.type as string)) {
        return NextResponse.json<ApiResponse>(
          { error: 'Each method must have a valid `id` and `type` (delivery | pickup).' },
          { status: 400 },
        );
      }
    }

    await connectDB();

    const updated = await AdminShippingSettings.findByIdAndUpdate(
      'admin_shipping_settings',
      { $set: { methods: body.methods } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await logAdminAction({
      adminId:    admin.userId,
      adminName:  admin.email,
      adminRole:  admin.role,
      action:     'updated_settings',
      detail:     `Updated shipping methods (${(body.methods as unknown[]).length} method${(body.methods as unknown[]).length === 1 ? '' : 's'})`,
      targetType: 'system',
      targetId:   'admin_shipping_settings',
    });

    return NextResponse.json<ApiResponse>({ success: true, data: updated });
  } catch (err) {
    console.error('[api/admin/settings/shipping PUT]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
