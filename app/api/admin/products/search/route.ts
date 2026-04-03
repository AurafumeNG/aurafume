import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Product                      from '@/models/Product';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';

/**
 * GET /api/admin/products/search?q=<query>&limit=<n>&excludeId=<id>
 *
 * Lightweight product search used by the Related Products picker.
 * Returns id, name, first variant SKU, and first image URL only.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q         = searchParams.get('q')?.trim()         ?? '';
  const limit     = Math.min(20, parseInt(searchParams.get('limit') ?? '6', 10));
  const excludeId = searchParams.get('excludeId')         ?? '';

  if (!q) {
    return NextResponse.json<ApiResponse<{ products: unknown[] }>>({
      success: true,
      data:    { products: [] },
    });
  }

  try {
    await connectDB();

    const filter: Record<string, unknown> = {
      status: { $in: ['draft', 'published'] },
      $or:    [
        { name:           { $regex: q, $options: 'i' } },
        { slug:           { $regex: q, $options: 'i' } },
        { 'variants.sku': { $regex: q, $options: 'i' } },
      ],
    };

    if (excludeId) filter._id = { $ne: excludeId };

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name slug variants images')
      .lean();

    const result = products.map(p => ({
      id:       p._id.toString(),
      name:     p.name,
      sku:      p.variants[0]?.sku ?? '',
      imageUrl: p.images[0]?.url  ?? '',
    }));

    return NextResponse.json<ApiResponse<{ products: typeof result }>>({
      success: true,
      data:    { products: result },
    });
  } catch (err) {
    console.error('[api/admin/products/search]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
