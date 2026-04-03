import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Coupon from '@/models/Coupon';
import type { IOrderItem, IOrderContact, IOrderAddress, IOrderGift, IOrderDelivery } from '@/models/Order';

// ── POST /api/orders — create a new order ──────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json() as {
      contact:         IOrderContact;
      shippingAddress: IOrderAddress;
      billingAddress?: IOrderAddress;
      items:           IOrderItem[];
      gift:            IOrderGift;
      delivery:        IOrderDelivery;
      payment: {
        method:      'bank-transfer' | 'paystack';
        paystackRef?: string;
      };
      couponCode?:    string;
      cartTotal:      number;   // subtotal before discounts/fees
      deliveryFee:    number;
      giftWrapFee:    number;
    };

    // ── Basic validation ───────────────────────────────────────────────────────
    const { contact, shippingAddress, items, delivery, payment, cartTotal, deliveryFee, giftWrapFee } = body;

    if (!contact?.email || !shippingAddress?.street || !items?.length || !delivery?.option || !payment?.method) {
      return NextResponse.json({ error: 'Missing required order fields.' }, { status: 400 });
    }

    // ── Resolve logged-in user (optional — guest checkout allowed) ─────────────
    const token = req.cookies.get('aura-auth')?.value;
    const payload = token ? verifyToken(token) : null;
    const userId = payload?.userId ?? undefined;

    // ── Coupon validation & discount computation ────────────────────────────────
    let discount = 0;
    let couponLabel: string | undefined;
    const couponCode = body.couponCode?.trim().toUpperCase();

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });

      if (coupon) {
        const now = new Date();
        const expired   = coupon.expiresAt && coupon.expiresAt < now;
        const exhausted = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
        const tooSmall  = cartTotal < coupon.minOrderAmount;

        if (!expired && !exhausted && !tooSmall) {
          discount = coupon.type === 'pct'
            ? Math.round(cartTotal * coupon.value / 100)
            : Math.min(coupon.value, cartTotal);
          couponLabel = coupon.label;

          // Increment usage count atomically
          await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
        }
      }
    }

    const total = Math.max(0, cartTotal - discount + deliveryFee + giftWrapFee);

    // ── Create the order ───────────────────────────────────────────────────────
    const order = await Order.create({
      ...(userId && { userId }),
      contact,
      shippingAddress,
      billingAddress: body.billingAddress,
      items,
      gift: body.gift ?? { isGift: false, wrapping: false, hidePrice: false },
      pricing: {
        subtotal:    cartTotal,
        discount,
        couponCode:  discount > 0 ? couponCode : undefined,
        couponLabel: discount > 0 ? couponLabel : undefined,
        deliveryFee,
        giftWrapFee,
        total,
      },
      delivery,
      payment: {
        method:      payment.method,
        status:      'pending',
        paystackRef: payment.paystackRef,
      },
      status: 'pending',
    });

    return NextResponse.json(
      { success: true, orderId: order._id.toString(), orderNumber: order.orderNumber },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}

// ── GET /api/orders — list orders for the authenticated user ───────────────────

export async function GET(req: NextRequest) {
  const token = req.cookies.get('aura-auth')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  }

  try {
    await connectDB();

    const orders = await Order.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    return NextResponse.json({ success: true, data: orders });
  } catch (err) {
    console.error('[GET /api/orders]', err);
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
}
