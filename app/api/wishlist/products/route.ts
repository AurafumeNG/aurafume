import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import type { ApiResponse } from '@/types/auth';

function auth(req: NextRequest) {
  const token = req.cookies.get('aura-auth')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export interface WishlistProduct {
  id:          string;
  slug:        string;
  name:        string;
  scentFamily: string;
  price:       number;
  image:       string;
  size:        string;   // first available size label
  stock:       'in-stock' | 'low-stock' | 'out-of-stock';
}

// GET /api/wishlist/products
// Returns full product details for every ID in the user's wishlist.

export async function GET(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();

    // 1. Fetch wishlist IDs from user document
    const userDoc = await User.collection.findOne(
      { _id: new mongoose.Types.ObjectId(payload.userId) },
      { projection: { wishlist: 1 } },
    );
    if (!userDoc) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    const ids: string[] = (userDoc.wishlist as string[]) ?? [];
    if (ids.length === 0) {
      return NextResponse.json<ApiResponse<WishlistProduct[]>>({ success: true, data: [] });
    }

    // 2. Resolve IDs → products (filter to valid ObjectIds to avoid cast errors)
    const objectIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const products = await Product.find({ _id: { $in: objectIds } })
      .select('name slug images fragranceFamilies variants')
      .lean();

    // 3. Preserve wishlist order and map to WishlistProduct shape
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const data: WishlistProduct[] = ids
      .filter((id) => productMap.has(id))
      .map((id) => {
        const p = productMap.get(id)!;

        const variants = p.variants as {
          size: string;
          price: number;
          stock: number;
          lowStockThreshold: number;
        }[];

        const prices    = variants.map((v) => v.price).filter((n) => n > 0);
        const minPrice  = prices.length ? Math.min(...prices) : 0;
        const firstSize = variants[0]?.size ?? '';

        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
        const isLowStock = variants.some(
          (v) => v.stock > 0 && v.stock <= v.lowStockThreshold,
        );
        const stock: WishlistProduct['stock'] =
          totalStock === 0 ? 'out-of-stock' :
          isLowStock      ? 'low-stock'     :
          'in-stock';

        return {
          id:          p._id.toString(),
          slug:        p.slug,
          name:        p.name,
          scentFamily: (p.fragranceFamilies as string[]).join(' · '),
          price:       minPrice,
          image:       p.images?.[0]?.url ?? '',
          size:        firstSize,
          stock,
        };
      });

    return NextResponse.json<ApiResponse<WishlistProduct[]>>({ success: true, data });
  } catch (err) {
    console.error('[GET /api/wishlist/products]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
