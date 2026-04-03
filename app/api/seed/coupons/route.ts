import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

// ── POST /api/seed/coupons — seed dummy coupons for testing ────────────────────
// DEVELOPMENT ONLY — protect this route in production

const DUMMY_COUPONS = [
  {
    code:           'AURA10',
    type:           'pct'  as const,
    value:          10,
    label:          '10% off',
    description:    'General 10% discount — for testing',
    minOrderAmount: 0,
    maxUses:        null,
  },
  {
    code:           'WELCOME15',
    type:           'pct'  as const,
    value:          15,
    label:          '15% off',
    description:    'Welcome discount for new customers — 15%',
    minOrderAmount: 0,
    maxUses:        null,
  },
  {
    code:           'FIRST5K',
    type:           'flat' as const,
    value:          5_000,
    label:          '₦5,000 off',
    description:    'Flat ₦5,000 discount — first order',
    minOrderAmount: 10_000,
    maxUses:        null,
  },
  {
    code:           'VIP20',
    type:           'pct'  as const,
    value:          20,
    label:          '20% off',
    description:    'VIP customer exclusive discount',
    minOrderAmount: 20_000,
    maxUses:        100,
  },
  {
    code:           'SUMMER25',
    type:           'pct'  as const,
    value:          25,
    label:          '25% off',
    description:    'Summer sale — 25% off orders above ₦15k',
    minOrderAmount: 15_000,
    maxUses:        200,
    expiresAt:      new Date('2026-12-31T23:59:59Z'),
  },
  {
    code:           'SAVE2K',
    type:           'flat' as const,
    value:          2_000,
    label:          '₦2,000 off',
    description:    'Flat ₦2,000 off any order — no minimum',
    minOrderAmount: 0,
    maxUses:        500,
  },
  {
    code:           'LUXURY30',
    type:           'pct'  as const,
    value:          30,
    label:          '30% off',
    description:    'Luxury tier — 30% off orders ₦50k and above',
    minOrderAmount: 50_000,
    maxUses:        50,
    expiresAt:      new Date('2026-06-30T23:59:59Z'),
  },
];

export async function POST() {
  // Guard: only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed endpoint is disabled in production.' }, { status: 403 });
  }

  try {
    await connectDB();

    const results = [];

    for (const def of DUMMY_COUPONS) {
      const existing = await Coupon.findOne({ code: def.code });
      if (existing) {
        results.push({ code: def.code, action: 'skipped (already exists)' });
        continue;
      }
      await Coupon.create({ ...def, usedCount: 0, isActive: true });
      results.push({ code: def.code, action: 'created' });
    }

    return NextResponse.json({ success: true, results }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/seed/coupons]', err);
    return NextResponse.json({ error: 'Seeding failed.' }, { status: 500 });
  }
}
