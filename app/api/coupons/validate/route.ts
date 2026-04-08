import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

// ── POST /api/coupons/validate ─────────────────────────────────────────────────
// Body: { code: string; cartTotal: number }
// Returns: { valid: true, label, discount } or { valid: false, reason }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { code?: string; cartTotal?: number };
    const code      = body.code?.trim().toUpperCase();
    const cartTotal = Number(body.cartTotal ?? 0);

    if (!code) {
      return NextResponse.json({ valid: false, reason: 'No coupon code provided.' }, { status: 400 });
    }

    await connectDB();

    const coupon = await Coupon.findOne({ code, isActive: true }).lean();

    if (!coupon) {
      return NextResponse.json({ valid: false, reason: 'This coupon code is invalid or has been deactivated.' });
    }

    // Expiry check
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'This coupon has expired.' });
    }

    // Usage limit check
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, reason: 'This coupon has reached its maximum usage limit.' });
    }

    // Minimum order check
    if (cartTotal < coupon.minOrderAmount) {
      const formatted = `₦${coupon.minOrderAmount.toLocaleString()}`;
      return NextResponse.json({
        valid:  false,
        reason: `This coupon requires a minimum order of ${formatted}.`,
      });
    }

    // Compute discount
    let discount = 0;
    if (coupon.type === 'pct') {
      const raw = Math.round(cartTotal * (coupon.value as number) / 100);
      discount = (coupon.hasPctCap && (coupon.pctCap as number) > 0)
        ? Math.min(raw, coupon.pctCap as number)
        : raw;
    } else if (coupon.type === 'flat') {
      discount = Math.min(coupon.value as number, cartTotal);
    }
    // 'free-shipping': discount = 0 here; delivery fee is zeroed at checkout
    // 'buy-x-get-y': not yet implemented

    return NextResponse.json({
      valid:    true,
      code:     coupon.code,
      label:    coupon.label,
      type:     coupon.type,
      value:    coupon.value,
      discount,
    });
  } catch (err) {
    console.error('[POST /api/coupons/validate]', err);
    return NextResponse.json({ valid: false, reason: 'Server error. Please try again.' }, { status: 500 });
  }
}
