import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Coupon                       from '@/models/Coupon';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

// ── PATCH — archive a promo code ──────────────────────────────────────────────

/**
 * Archives a promo code — sets status to "archived" and disables it.
 * Only codes with zero usage may be archived via the table action.
 * Admins with higher access (e.g. superadmin) may archive any code.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await connectDB();

    const coupon = await Coupon.findById(id).select('usedCount status').lean() as {
      usedCount: number;
      status:    string;
    } | null;

    if (!coupon) {
      return NextResponse.json<ApiResponse>({ error: 'Promo code not found.' }, { status: 404 });
    }

    if (coupon.status === 'archived') {
      return NextResponse.json<ApiResponse>({ error: 'Code is already archived.' }, { status: 422 });
    }

    // Non-superadmins can only archive codes with no usage
    if (admin.role !== 'superadmin' && coupon.usedCount > 0) {
      return NextResponse.json<ApiResponse>(
        { error: 'Only codes with no usage can be archived. Contact a super admin to force-archive.' },
        { status: 422 },
      );
    }

    await Coupon.findByIdAndUpdate(id, {
      $set: { status: 'archived', isActive: false },
    });

    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[api/admin/promos/:id/archive PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
