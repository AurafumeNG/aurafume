import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireAdmin } from '@/lib/admin-auth';
import type { ApiResponse } from '@/types/auth';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  // const admin = await requireAdmin();
  // if (!admin) {
  //   return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  // }

  const { slug } = await ctx.params;

  try {
    await connectDB();
    const product = await Product.findOne({ slug }).lean();
    if (!product) {
      return NextResponse.json<ApiResponse>(
        { error: 'Product not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json<ApiResponse<unknown>>({
      success: true,
      data: product,
    });
  } catch (err) {
    console.error('[api/admin/products/by-slug GET]', err);
    return NextResponse.json<ApiResponse>(
      { error: 'Server error.' },
      { status: 500 },
    );
  }
}
