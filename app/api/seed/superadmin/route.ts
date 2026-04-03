import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const SUPERADMIN_EMAIL = 'pynacode@gmail.com';

// ── POST /api/seed/superadmin ──────────────────────────────────────────────────
// Promotes pynacode@gmail.com to the superadmin role.
// Run once during initial setup. Idempotent — safe to call multiple times.
// DEVELOPMENT ONLY — blocked in production.

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed endpoint is disabled in production.' }, { status: 403 });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: SUPERADMIN_EMAIL });

    if (!user) {
      return NextResponse.json(
        { error: `No account found for ${SUPERADMIN_EMAIL}. Register the account first, then run this seed.` },
        { status: 404 },
      );
    }

    if (user.role === 'superadmin') {
      return NextResponse.json({ success: true, message: `${SUPERADMIN_EMAIL} is already superadmin.` });
    }

    user.role = 'superadmin';
    await user.save();

    return NextResponse.json({
      success: true,
      message: `${SUPERADMIN_EMAIL} promoted to superadmin.`,
    });
  } catch (err) {
    console.error('[POST /api/seed/superadmin]', err);
    return NextResponse.json({ error: 'Seeding failed.' }, { status: 500 });
  }
}
