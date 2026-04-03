import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import type { ApiResponse } from '@/types/auth';

function auth(req: NextRequest) {
  const token = req.cookies.get('aura-auth')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── GET /api/addresses ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId).select('addresses');
    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: user.addresses });
  } catch (err) {
    console.error('[GET /api/addresses]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}

// ── POST /api/addresses ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      label: string;
      street: string;
      apt?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefault: boolean;
    };

    const { label, street, city, state, postalCode, country, isDefault } = body;

    if (!label?.trim() || !street?.trim() || !city?.trim() || !state?.trim() || !postalCode?.trim()) {
      return NextResponse.json<ApiResponse>(
        { error: 'Label, street, city, state, and postal code are required.' },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(payload.userId).select('addresses');
    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    // If this is the first address or explicitly set as default, clear existing defaults
    const shouldBeDefault = isDefault || user.addresses.length === 0;
    if (shouldBeDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    user.addresses.push({
      label:      label.trim(),
      street:     street.trim(),
      apt:        body.apt?.trim() || undefined,
      city:       city.trim(),
      state:      state.trim(),
      postalCode: postalCode.trim(),
      country:    (country?.trim()) || 'Nigeria',
      isDefault:  shouldBeDefault,
    });

    await user.save();

    return NextResponse.json({ success: true, data: user.addresses }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/addresses]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
