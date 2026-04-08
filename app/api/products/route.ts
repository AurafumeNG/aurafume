import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import type { ShopProduct } from '@/components/shop/types';
import type { ApiResponse } from '@/types/auth';

export async function GET() {
  try {
    await connectDB();

    const products = await Product.find({
      status: 'published',
      visibleInShop: true,
    })
      .select(
        'name slug images fragranceFamilies gender variants isBestSeller isNewArrival createdAt',
      )
      .sort({ createdAt: -1 })
      .lean();

    const data: ShopProduct[] = products.map((p) => {
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
    console.error('[api/products GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
