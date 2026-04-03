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

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    const verificationToken       = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

    await User.create({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      email:     email.toLowerCase().trim(),
      phone:     phone?.trim(),
      password,
      verificationToken,
      verificationTokenExpiry,
    });

    await sendVerificationEmail(email.trim(), verificationToken, firstName.trim());

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
