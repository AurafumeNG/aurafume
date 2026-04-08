import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/admin-auth';
import AdminPaymentSettings, { getPaymentSettings } from '@/models/AdminPaymentSettings';
import { logAdminAction } from '@/models/AdminActivityLog';
import type { ApiResponse } from '@/types/auth';

// ── GET /api/admin/settings/payments ──────────────────────────────────────────

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const settings = await getPaymentSettings();

    // Never send the raw account number to the client — mask all but last 4
    const data = settings.toObject();
    if (data.bankTransfer?.accountNumber) {
      const n = data.bankTransfer.accountNumber as string;
      data.bankTransfer.accountNumber =
        n.length > 4 ? '•'.repeat(n.length - 4) + n.slice(-4) : n;
    }

    return NextResponse.json<ApiResponse>({ success: true, data });
  } catch (err) {
    console.error('[api/admin/settings/payments GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/settings/payments ────────────────────────────────────────
// Superadmin only.

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can modify payment settings.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json() as {
      bankTransfer?: Partial<{
        enabled:                   boolean;
        bankName:                  string;
        accountName:               string;
        accountNumber:             string;
        verificationDeadlineHours: number;
        verificationInstructions:  string;
      }>;
      methodsOrder?: unknown[];
    };

    const updates: Record<string, unknown> = {};

    if (body.bankTransfer) {
      const allowed = [
        'enabled', 'bankName', 'accountName', 'accountNumber',
        'verificationDeadlineHours', 'verificationInstructions',
      ] as const;
      for (const key of allowed) {
        if (key in body.bankTransfer) {
          // Reject masked placeholder values — client sends '••••1234' when the
          // field was never edited; we should leave the stored value untouched.
          if (key === 'accountNumber') {
            const val = body.bankTransfer.accountNumber as string;
            if (val.includes('•')) continue; // unchanged masked value
          }
          updates[`bankTransfer.${key}`] = body.bankTransfer[key];
        }
      }
    }

    if (Array.isArray(body.methodsOrder)) {
      for (const m of body.methodsOrder as Record<string, unknown>[]) {
        if (!m.id) {
          return NextResponse.json<ApiResponse>(
            { error: 'Each payment method must have an `id`.' },
            { status: 400 },
          );
        }
      }
      updates['methodsOrder'] = body.methodsOrder;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>({ error: 'No valid fields to update.' }, { status: 400 });
    }

    await connectDB();

    const updated = await AdminPaymentSettings.findByIdAndUpdate(
      'admin_payment_settings',
      { $set: updates },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await logAdminAction({
      adminId:    admin.userId,
      adminName:  admin.email,
      adminRole:  admin.role,
      action:     'updated_settings',
      detail:     'Updated payment settings',
      targetType: 'system',
      targetId:   'admin_payment_settings',
    });

    // Return masked account number
    const data = updated!.toObject();
    if (data.bankTransfer?.accountNumber) {
      const n = data.bankTransfer.accountNumber as string;
      data.bankTransfer.accountNumber =
        n.length > 4 ? '•'.repeat(n.length - 4) + n.slice(-4) : n;
    }

    return NextResponse.json<ApiResponse>({ success: true, data });
  } catch (err) {
    console.error('[api/admin/settings/payments PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
