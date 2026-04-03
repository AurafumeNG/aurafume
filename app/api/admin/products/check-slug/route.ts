import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Product                      from '@/models/Product';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

/**
 * GET /api/admin/products/check-slug?slug=<slug>&excludeId=<id>
 *
 * Returns { available: true } if no product owns the slug,
 * { available: false } if it is already taken.
 *
 * Pass `excludeId` when editing an existing product so the product's
 * own slug is not treated as a conflict.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug             = searchParams.get('slug')?.trim().toLowerCase() ?? '';
  const excludeId        = searchParams.get('excludeId') ?? '';

  if (!slug) {
    return NextResponse.json<ApiResponse<{ available: boolean }>>(
      { success: true, data: { available: false } },
    );
  }

  // Basic slug format check (letters, numbers, hyphens only)
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return NextResponse.json<ApiResponse<{ available: boolean; reason: string }>>(
      {
        success: true,
        data:    { available: false, reason: 'Slug may only contain lowercase letters, numbers, and hyphens.' } as { available: boolean; reason: string },
      },
    );
  }

  try {
    await connectDB();

    const query: Record<string, unknown> = { slug };
    if (excludeId) query._id = { $ne: excludeId };

    const exists = await Product.exists(query);

    return NextResponse.json<ApiResponse<{ available: boolean }>>({
      success: true,
      data:    { available: !exists },
    });
  } catch (err) {
    console.error('[api/admin/products/check-slug]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
