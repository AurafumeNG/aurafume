import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Coupon                       from '@/models/Coupon';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

// ── POST — duplicate a promo code ─────────────────────────────────────────────

export async function POST(
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

    const original = await Coupon.findById(id).lean() as Record<string, unknown> | null;

    if (!original) {
      return NextResponse.json<ApiResponse>({ error: 'Promo code not found.' }, { status: 404 });
    }

    // Generate a unique code for the duplicate — append -COPY, then -COPY2, etc.
    const baseCode = String(original.code ?? '').slice(0, 14); // leave room for suffix
    let newCode    = `${baseCode}-COPY`;
    let suffix     = 2;
    while (await Coupon.exists({ code: newCode })) {
      newCode = `${baseCode}-CP${suffix}`;
      suffix++;
    }

    // Clone all fields, reset usage counters and set status to draft
    const { _id, __v, createdAt, updatedAt, ...rest } = original;
    void _id; void __v; void createdAt; void updatedAt;

    const clone = await Coupon.create({
      ...rest,
      code:      newCode,
      status:    'draft',
      isActive:  false,
      usedCount: 0,
    });

    return NextResponse.json<ApiResponse<{ id: string; code: string }>>(
      { success: true, data: { id: clone._id.toString(), code: clone.code } },
      { status: 201 },
    );
  } catch (err) {
    console.error('[api/admin/promos/:id/duplicate POST]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
