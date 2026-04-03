import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

// ── GET /api/orders/[id] — fetch a single order ────────────────────────────────
// Accessible by:
//   • The authenticated user who placed the order (userId match)
//   • Any request if the order has no userId (guest orders — rely on orderId secrecy)
//   • Admin users (any order)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await connectDB();

    // Support lookup by MongoDB _id OR by Paystack reference
    let order = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).select('-__v').lean();
    }

    // If not found by _id, try by paystackRef
    if (!order) {
      order = await Order.findOne({ 'payment.paystackRef': id }).select('-__v').lean();
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Authorization check — allow guest orders freely; authenticated orders must match
    const token   = req.cookies.get('aura-auth')?.value;
    const payload = token ? verifyToken(token) : null;

    const orderUserId = (order as { userId?: unknown }).userId?.toString();

    if (orderUserId) {
      // Order belongs to an account — must be the owner or an admin
      if (!payload || (payload.userId !== orderUserId && payload.role !== 'admin')) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    }
    // Guest orders: no auth required — the unique orderId/ref is the "secret"

    return NextResponse.json({ success: true, data: order });
  } catch (err) {
    console.error('[GET /api/orders/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch order.' }, { status: 500 });
  }
}
