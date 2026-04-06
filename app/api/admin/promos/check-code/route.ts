import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Coupon                       from '@/models/Coupon';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

/**
 * GET /api/admin/promos/check-code?code=WELCOME10&excludeId=<id>
 *
 * Returns { available: true } if no promo code owns this code string.
 * Pass `excludeId` when editing an existing code to exclude itself.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code      = searchParams.get('code')?.toUpperCase().trim() ?? '';
  const excludeId = searchParams.get('excludeId') ?? '';

  if (!code) {
    return NextResponse.json<ApiResponse<{ available: boolean }>>(
      { success: true, data: { available: false } },
    );
  }

  // Format validation — uppercase letters, numbers, hyphens, 1–20 chars
  if (!/^[A-Z0-9-]{1,20}$/.test(code)) {
    return NextResponse.json<ApiResponse<{ available: boolean; reason: string }>>(
      { success: true, data: { available: false, reason: 'Invalid code format.' } as { available: boolean; reason: string } },
    );
  }

  try {
    await connectDB();

    const query: Record<string, unknown> = { code };
    if (excludeId) query._id = { $ne: excludeId };

    const exists = await Coupon.exists(query);

    return NextResponse.json<ApiResponse<{ available: boolean }>>({
      success: true,
      data:    { available: !exists },
    });
  } catch (err) {
    console.error('[api/admin/promos/check-code GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
