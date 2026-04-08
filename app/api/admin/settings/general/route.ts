import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import AdminGeneralSettings, { getGeneralSettings } from '@/models/AdminGeneralSettings';
import { logAdminAction } from '@/models/AdminActivityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/settings/general ──────────────────────────────────────────

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const settings = await getGeneralSettings();
    return NextResponse.json<ApiResponse>({ success: true, data: settings });
  } catch (err) {
    console.error('[api/admin/settings/general GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/settings/general ────────────────────────────────────────
// Accepts either:
//   - application/json  → text fields only
//   - multipart/form-data → text fields + logo / favicon files

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can modify general settings.' },
      { status: 403 },
    );
  }

  try {
    const contentType = req.headers.get('content-type') ?? '';
    const updates: Record<string, unknown> = {};

    const TEXT_FIELDS = [
      'storeName', 'storeTagline', 'storeEmail', 'storePhone',
      'streetAddress', 'city', 'state', 'country',
    ] as const;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();

      // Text fields
      for (const key of TEXT_FIELDS) {
        const val = formData.get(key);
        if (typeof val === 'string') updates[key] = val;
      }

      // File fields
      const uploadDir = path.join(process.cwd(), 'public', 'brand');
      await mkdir(uploadDir, { recursive: true });

      for (const field of ['logo', 'favicon'] as const) {
        const file = formData.get(field);
        if (!(file instanceof File)) continue;

        if (file.size > 512 * 1024) {
          return NextResponse.json<ApiResponse>(
            { error: `${field === 'logo' ? 'Logo' : 'Favicon'} must be under 512 KB.` },
            { status: 400 },
          );
        }

        const ext      = file.name.split('.').pop() ?? 'png';
        const filename = `${field}.${ext}`;
        const buffer   = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadDir, filename), buffer);
        updates[`${field}Url`] = `/brand/${filename}`;
      }
    } else {
      // JSON body — text fields only
      const body = await req.json() as Record<string, unknown>;
      for (const key of TEXT_FIELDS) {
        if (key in body) updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>({ error: 'No valid fields to update.' }, { status: 400 });
    }

    await connectDB();

    const updated = await AdminGeneralSettings.findByIdAndUpdate(
      'admin_general_settings',
      { $set: updates },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await logAdminAction({
      adminId:    admin.userId,
      adminName:  admin.email,
      adminRole:  admin.role,
      action:     'updated_settings',
      detail:     'Updated general settings',
      targetType: 'system',
      targetId:   'admin_general_settings',
    });

    return NextResponse.json<ApiResponse>({ success: true, data: updated });
  } catch (err) {
    console.error('[api/admin/settings/general PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
