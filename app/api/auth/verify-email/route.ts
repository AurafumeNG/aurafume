import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${BASE}/verify-email?error=invalid`);
  }

  try {
    await connectDB();

    const user = await User.findOne({
      verificationToken:       token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.redirect(`${BASE}/verify-email?error=expired`);
    }

    user.isVerified              = true;
    user.verificationToken       = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return NextResponse.redirect(`${BASE}/verify-email?verified=1`);
  } catch (err) {
    console.error('[api/auth/verify-email]', err);
    return NextResponse.redirect(`${BASE}/verify-email?error=server`);
  }
}
