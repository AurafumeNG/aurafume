import { NextRequest, NextResponse } from 'next/server';
import mongoose                      from 'mongoose';
import connectDB                     from '@/lib/mongodb';
import Product                       from '@/models/Product';
import Order                         from '@/models/Order';
import User                          from '@/models/User';
import { requireAdmin }              from '@/lib/admin-auth';
import type { ApiResponse }          from '@/types/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await connectDB();

    const product = await Product.findById(id).select('createdBy').lean();
    if (!product) {
      return NextResponse.json<ApiResponse>({ error: 'Product not found.' }, { status: 404 });
    }

    // Units sold: sum qty for this product across non-cancelled orders
    const salesAgg = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, 'items.productId': id } },
      { $unwind: '$items' },
      { $match: { 'items.productId': id } },
      { $group: { _id: null, total: { $sum: '$items.qty' } } },
    ]);
    const unitsSold: number = salesAgg[0]?.total ?? 0;

    // Wishlisted: count of users who have this product in their wishlist
    const wishlisted: number = await User.countDocuments({ wishlist: id });

    // Creator name
    let createdByName = 'Unknown Admin';
    if (product.createdBy) {
      try {
        const isValidId = mongoose.Types.ObjectId.isValid(product.createdBy);
        if (isValidId) {
          const creator = await User.findById(product.createdBy)
            .select('firstName lastName')
            .lean();
          if (creator) {
            createdByName = `${creator.firstName} ${creator.lastName}`.trim();
          }
        }
      } catch { /* ignore lookup failure */ }
    }

    return NextResponse.json<ApiResponse<{
      views:         number;
      cartAdds:      number;
      unitsSold:     number;
      wishlisted:    number;
      avgRating:     number;
      reviewCount:   number;
      createdByName: string;
    }>>({
      success: true,
      data: {
        views:         0,   // requires event-tracking infrastructure
        cartAdds:      0,   // requires event-tracking infrastructure
        unitsSold,
        wishlisted,
        avgRating:     0,   // requires reviews collection
        reviewCount:   0,   // requires reviews collection
        createdByName,
      },
    });
  } catch (err) {
    console.error('[api/admin/products/[id]/stats GET]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
