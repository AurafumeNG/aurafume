import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { ApiResponse } from '@/types/auth';

function auth(req: NextRequest) {
  const token = req.cookies.get('aura-auth')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/wishlist — returns the authenticated user's wishlisted product IDs
export async function GET(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();
    const doc = await User.collection.findOne(
      { _id: new mongoose.Types.ObjectId(payload.userId) },
      { projection: { wishlist: 1 } },
    );
    if (!doc) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: (doc.wishlist as string[]) ?? [] });
  } catch (err) {
    console.error('[GET /api/wishlist]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/wishlist — toggle a product in/out of the wishlist
// Body: { productId: string }
// Response: { wishlisted: boolean, wishlist: string[] }
export async function POST(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { productId } = (await req.json()) as { productId: string };
    if (!productId?.trim()) {
      return NextResponse.json<ApiResponse>({ error: 'productId is required' }, { status: 400 });
    }

    await connectDB();
    const _id = new mongoose.Types.ObjectId(payload.userId);

    // Read current wishlist directly from the collection (bypasses schema casting)
    const doc = await User.collection.findOne({ _id }, { projection: { wishlist: 1 } });
    if (!doc) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    const current: string[] = (doc.wishlist as string[]) ?? [];
    const alreadyWishlisted = current.includes(productId);

    if (alreadyWishlisted) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await User.collection.updateOne({ _id }, { $pull: { wishlist: productId } } as any);
    } else {
      await User.collection.updateOne({ _id }, { $addToSet: { wishlist: productId } });
    }

    const updated = await User.collection.findOne({ _id }, { projection: { wishlist: 1 } });
    const wishlist = (updated?.wishlist as string[]) ?? [];

    return NextResponse.json({
      success: true,
      data: { wishlisted: !alreadyWishlisted, wishlist },
    });
  } catch (err) {
    console.error('[POST /api/wishlist]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
