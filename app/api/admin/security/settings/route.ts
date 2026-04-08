import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import AdminSecuritySettings, { getSecuritySettings } from '@/models/AdminSecuritySettings';
import { logSecurityEvent } from '@/models/SecurityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/security/settings ─────────────────────────────────────────

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const settings = await getSecuritySettings();
    return NextResponse.json<ApiResponse>({ success: true, data: settings });
  } catch (err) {
    console.error('[api/admin/security/settings GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/security/settings ────────────────────────────────────────
// Superadmin only

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can modify security settings.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();

    // Whitelist of updatable fields
    const allowed = [
      'minPasswordLength', 'requireUppercase', 'requireNumber', 'requireSpecial',
      'passwordExpiry', 'expiryDays',
      'maxLoginAttempts', 'lockoutMinutes', 'rememberDeviceDays',
      'sessionTimeoutHours', 'ipRestriction', 'allowedIps',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>({ error: 'No valid fields to update.' }, { status: 400 });
    }

    await connectDB();
    const updated = await AdminSecuritySettings.findByIdAndUpdate(
      'admin_security_settings',
      { $set: updates },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await logSecurityEvent({
      event:       'settings_changed',
      description: 'Admin security settings updated',
      severity:    'info',
      adminId:     admin.userId,
      adminName:   admin.email,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: updated });
  } catch (err) {
    console.error('[api/admin/security/settings PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
