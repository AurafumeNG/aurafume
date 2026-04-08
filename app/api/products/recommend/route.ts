import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import type { ApiResponse } from '@/types/auth';

// Maps quiz scent answer → fragranceFamilies values stored on products
const SCENT_MAP: Record<string, string[]> = {
  floral:   ['Floral'],
  woody:    ['Woody'],
  oriental: ['Oriental', 'Oud'],
  fresh:    ['Fresh', 'Citrus'],
};

// Maps quiz "who" answer → gender values stored on products
const GENDER_MAP: Record<string, string[]> = {
  'myself-her': ['Her', 'Unisex'],
  'myself-him': ['Him', 'Unisex'],
  'gift-her':   ['Her', 'Unisex'],
  'gift-him':   ['Him', 'Unisex'],
};

export interface RecommendedProduct {
  id:     string;
  name:   string;
  notes:  string;   // fragranceFamilies joined as display string
  price:  number;   // lowest variant price
  image:  string;
  href:   string;
  badge?: string;
}

// ── GET /api/products/recommend?scent=floral&who=myself-her ───────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const scent = searchParams.get('scent') ?? '';
  const who   = searchParams.get('who')   ?? '';

  try {
    await connectDB();

    const familyFilter = SCENT_MAP[scent];
    const genderFilter = GENDER_MAP[who];

    // Build query — prioritise scent match, fall back to just published products
    const query: Record<string, unknown> = {
      status:        'published',
      visibleInShop: true,
    };

    if (familyFilter?.length) {
      query.fragranceFamilies = { $in: familyFilter };
    }
    if (genderFilter?.length) {
      query.gender = { $in: genderFilter };
    }

    let products = await Product.find(query)
      .select('name slug images fragranceFamilies gender variants isBestSeller isNewArrival')
      .limit(4)
      .lean();

    // If too few matches (< 2), relax gender constraint
    if (products.length < 2 && genderFilter?.length) {
      const relaxed = { ...query };
      delete relaxed.gender;
      products = await Product.find(relaxed)
        .select('name slug images fragranceFamilies gender variants isBestSeller isNewArrival')
        .limit(4)
        .lean();
    }

    // Final fallback — just return any published products
    if (products.length === 0) {
      products = await Product.find({ status: 'published', visibleInShop: true })
        .select('name slug images fragranceFamilies gender variants isBestSeller isNewArrival')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();
    }

    const data: RecommendedProduct[] = products.map((p) => {
      const prices   = p.variants.map((v: { price: number }) => v.price).filter((n: number) => n > 0);
      const minPrice = prices.length ? Math.min(...prices) : 0;

      const isLowStock = p.variants.some(
        (v: { stock: number; lowStockThreshold: number }) =>
          v.stock > 0 && v.stock <= v.lowStockThreshold,
      );
      const badge = isLowStock
        ? 'Low Stock'
        : p.isBestSeller
          ? 'Best Seller'
          : p.isNewArrival
            ? 'New'
            : undefined;

      return {
        id:    p._id.toString(),
        name:  p.name,
        notes: (p.fragranceFamilies as string[]).join(' · '),
        price: minPrice,
        image: p.images?.[0]?.url ?? '',
        href:  `/shop/${p.slug}`,
        badge,
      };
    });

    return NextResponse.json<ApiResponse<RecommendedProduct[]>>({ success: true, data });
  } catch (err) {
    console.error('[api/products/recommend GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
