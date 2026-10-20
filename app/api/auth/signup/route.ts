import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/email';
import type { SignUpRequestBody, ApiResponse } from '@/types/auth';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SignUpRequestBody;
    const { firstName, lastName, email, phone, password } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      return NextResponse.json<ApiResponse>({ error: 'All required fields must be filled.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    await connectDB();

    const verificationToken       = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing && (existing.isVerified || existing.provider !== 'local')) {
      return NextResponse.json<ApiResponse>(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    if (existing) {
      // Unverified local account (e.g. a previous attempt whose email never arrived) —
      // let the shopper sign up again rather than locking them out.
      existing.firstName               = firstName.trim();
      existing.lastName                = lastName.trim();
      existing.phone                   = phone?.trim();
      existing.password                = password;
      existing.verificationToken       = verificationToken;
      existing.verificationTokenExpiry = verificationTokenExpiry;
      await existing.save();
    } else {
      await User.create({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.toLowerCase().trim(),
        phone:     phone?.trim(),
        password,
        verificationToken,
        verificationTokenExpiry,
      });
    }

    try {
      await sendVerificationEmail(email.trim(), verificationToken, firstName.trim());
    } catch (mailErr) {
      // The account is saved and unverified, so submitting again (or "resend" on the
      // login page) will retry the email.
      console.error('[api/auth/signup] verification email failed', mailErr);
      return NextResponse.json<ApiResponse>(
        { error: "We couldn't send your verification email. Please try again in a moment." },
        { status: 502 },
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: 'Account created! Please check your email to verify your account.' },
      { status: 201 },
    );
  } catch (err) {
    console.error('[api/auth/signup]', err);
    return NextResponse.json<ApiResponse>(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
