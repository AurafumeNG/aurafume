import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';

// ── PATCH /api/orders/[id]/proof — attach proof of payment ────────────────────
// Open to anyone who knows the orderId (guest-order security model).
// The client uploads the image directly to Cloudinary and sends back the
// resulting secure_url. We store that URL on the order document.

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const { proofUrl } = (await req.json()) as { proofUrl?: string };

    if (
      !proofUrl ||
      !proofUrl.startsWith('https://res.cloudinary.com/')
    ) {
      return NextResponse.json(
        { error: 'Invalid proof URL.' },
        { status: 400 },
      );
    }

    await connectDB();

    const filter = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { orderNumber: id };

    const order = await Order.findOneAndUpdate(
      { ...filter, 'payment.method': 'bank-transfer' },
      { $set: { 'payment.proofUrl': proofUrl } },
      { new: true, select: 'orderNumber payment.proofUrl' },
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { proofUrl: order.payment.proofUrl },
    });
  } catch (err) {
    console.error('[PATCH /api/orders/[id]/proof]', err);
    return NextResponse.json(
      { error: 'Failed to save proof of payment.' },
      { status: 500 },
    );
  }
}
