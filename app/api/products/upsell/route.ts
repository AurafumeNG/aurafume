import { NextRequest, NextResponse } from 'next/server';
import { getUpsellProducts } from '@/lib/related-products';
import type { ApiResponse } from '@/types/auth';
import type { RelatedProduct } from '@/components/pdp/types';

// ── GET /api/products/upsell?slugs=a,b,c ──────────────────────────────────────
// Returns products to suggest alongside the given cart slugs, excluding them.

export async function GET(req: NextRequest) {
  const slugs = (req.nextUrl.searchParams.get('slugs') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return NextResponse.json<ApiResponse<RelatedProduct[]>>({ success: true, data: [] });
  }

  try {
    const data = await getUpsellProducts(slugs, 6);
    return NextResponse.json<ApiResponse<RelatedProduct[]>>({ success: true, data });
  } catch (err) {
    console.error('[api/products/upsell GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
