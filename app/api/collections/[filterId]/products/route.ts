import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import Product                      from '@/models/Product';
import type { ShopProduct }         from '@/components/shop/types';
import type { ApiResponse }         from '@/types/auth';
import type { CollectionFilterId }  from '@/components/shop/collections-filter-bar';

// ── Query builder ─────────────────────────────────────────────────────
function buildQuery(filterId: CollectionFilterId): Record<string, unknown> | null {
  const base = { status: 'published', visibleInShop: true };

  const FAMILY_MAP: Partial<Record<CollectionFilterId, string>> = {
    floral:   'Floral',
    woody:    'Woody',
    fresh:    'Fresh',
    oriental: 'Oriental',
    citrus:   'Citrus',
  };

  const OCCASION_MAP: Partial<Record<CollectionFilterId, string>> = {
    office:            'Office',
    evening:           'Evening',
    daily:             'Daily',
    'special-occasion': 'Special Occasion',
  };

  if (FAMILY_MAP[filterId]) {
    return { ...base, fragranceFamilies: { $regex: new RegExp(`^${FAMILY_MAP[filterId]}$`, 'i') } };
  }

  if (OCCASION_MAP[filterId]) {
    return { ...base, occasions: { $regex: new RegExp(`^${OCCASION_MAP[filterId]}$`, 'i') } };
  }

  if (filterId === 'new-arrivals')  return { ...base, isNewArrival: true };
  if (filterId === 'best-sellers')  return { ...base, isBestSeller: true };
  if (filterId === 'gift-sets')     return { ...base, collections: { $regex: /^gift-sets$/i } };
  if (filterId === 'luxury-edit')   return {
    ...base,
    $or: [
      { isFeatured: true },
      { collections: { $regex: /^luxury-edit$/i } },
    ],
  };

  return null;
}

// ── Route ─────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filterId: string }> },
) {
  const { filterId } = await params;
  const query = buildQuery(filterId as CollectionFilterId);

  if (!query) {
    return NextResponse.json<ApiResponse>(
      { error: 'Unknown collection.' },
      { status: 404 },
    );
  }

  try {
    await connectDB();

    const products = await Product.find(query)
      .select('name slug images fragranceFamilies gender variants isBestSeller isNewArrival createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const data: ShopProduct[] = products.map(p => {
      const prices     = p.variants.map((v: { price: number }) => v.price).filter((n: number) => n > 0);
      const minPrice   = prices.length ? Math.min(...prices) : 0;
      const sizes      = p.variants.map((v: { size: string }) => v.size);
      const scentTags  = p.fragranceFamilies as string[];
      const scentFamily = scentTags.join(' · ');
      const image      = p.images?.[0]?.url ?? '';

      const isLowStock = p.variants.some(
        (v: { stock: number; lowStockThreshold: number }) =>
          v.stock > 0 && v.stock <= v.lowStockThreshold,
      );
      const badge: ShopProduct['badge'] = isLowStock
        ? 'Low Stock'
        : p.isBestSeller
          ? 'Best Seller'
          : p.isNewArrival
            ? 'New'
            : undefined;

      const gender = (['Him', 'Her', 'Unisex'].includes(p.gender)
        ? p.gender
        : 'Unisex') as ShopProduct['gender'];

      return {
        id:          p._id.toString(),
        name:        p.name,
        scentFamily,
        scentTags,
        price:       minPrice,
        image,
        badge,
        href:        `/shop/${p.slug}`,
        rating:      0,
        reviewCount: 0,
        gender,
        sizes,
        createdAt:   Math.floor(new Date(p.createdAt as Date).getTime() / 1000),
      };
    });

    return NextResponse.json<ApiResponse<ShopProduct[]>>({ success: true, data });
  } catch (err) {
    console.error('[api/collections/[filterId]/products GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
