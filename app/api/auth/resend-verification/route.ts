import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/email';
import type { ApiResponse } from '@/types/auth';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
const COOLDOWN_MS  = 60 * 1000;           // one email per account per minute

// Consistent message regardless of whether user exists — prevents email enumeration
const SUCCESS_MSG =
  "If that email belongs to an unverified account, we've sent a new verification link.";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email?.trim()) {
      return NextResponse.json<ApiResponse>({ error: 'Email is required.' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && !user.isVerified && user.provider === 'local') {
      // Token expiry = issue time + TTL, so it doubles as a per-account cooldown
      const issuedAt = user.verificationTokenExpiry
        ? user.verificationTokenExpiry.getTime() - TOKEN_TTL_MS
        : 0;

      if (Date.now() - issuedAt >= COOLDOWN_MS) {
        const verificationToken      = crypto.randomBytes(32).toString('hex');
        user.verificationToken       = verificationToken;
        user.verificationTokenExpiry = new Date(Date.now() + TOKEN_TTL_MS);
        await user.save();
        await sendVerificationEmail(user.email, verificationToken, user.firstName);
      }
    }

    return NextResponse.json<ApiResponse>({ success: true, message: SUCCESS_MSG });
  } catch (err) {
    console.error('[api/auth/resend-verification]', err);
    return NextResponse.json<ApiResponse>({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
