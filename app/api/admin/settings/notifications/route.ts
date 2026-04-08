import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import AdminNotificationSettings, {
  getNotificationSettings,
} from '@/models/AdminNotificationSettings';
import { logAdminAction } from '@/models/AdminActivityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/settings/notifications ─────────────────────────────────────

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const settings = await getNotificationSettings();
    return NextResponse.json<ApiResponse>({ success: true, data: settings });
  } catch (err) {
    console.error('[api/admin/settings/notifications GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/settings/notifications ───────────────────────────────────
// Superadmin only

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can modify notification settings.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();

    // Build a flat $set map from the nested body so untouched fields are preserved
    const updates: Record<string, unknown> = {};

    const topKeys = [
      'orderAlerts',
      'bankTransferAlerts',
      'inventoryAlerts',
      'customerAlerts',
      'systemAlerts',
      'globalRecipients',
    ] as const;

    for (const section of topKeys) {
      if (!(section in body)) continue;

      if (section === 'globalRecipients') {
        updates['globalRecipients'] = body.globalRecipients;
        continue;
      }

      // Nested section — dot-notation to avoid wiping sibling fields
      const sectionBody = body[section] as Record<string, unknown>;
      for (const [field, value] of Object.entries(sectionBody)) {
        updates[`${section}.${field}`] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>({ error: 'No valid fields to update.' }, { status: 400 });
    }

    await connectDB();
    const updated = await AdminNotificationSettings.findByIdAndUpdate(
      'admin_notification_settings',
      { $set: updates },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await logAdminAction({
      adminId:    admin.userId,
      adminName:  admin.email,
      adminRole:  admin.role,
      action:     'updated_settings',
      detail:     'Updated notification settings',
      targetType: 'system',
      targetId:   'admin_notification_settings',
    });

    return NextResponse.json<ApiResponse>({ success: true, data: updated });
  } catch (err) {
    console.error('[api/admin/settings/notifications PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
