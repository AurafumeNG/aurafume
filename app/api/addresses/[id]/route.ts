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

// ── PATCH /api/addresses/[id] ──────────────────────────────────────────────────
// Used for both full edits and set-as-default (send { isDefault: true } only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await req.json()) as Partial<{
      label: string;
      street: string;
      apt: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefault: boolean;
    }>;

    await connectDB();
    const user = await User.findById(payload.userId).select('addresses');
    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    const address = user.addresses.find(a => a._id?.toString() === id);
    if (!address) {
      return NextResponse.json<ApiResponse>({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset all others first
    if (body.isDefault === true) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    // Apply patch
    if (body.label      !== undefined) address.label      = body.label.trim();
    if (body.street     !== undefined) address.street     = body.street.trim();
    if (body.apt        !== undefined) address.apt        = body.apt.trim() || undefined;
    if (body.city       !== undefined) address.city       = body.city.trim();
    if (body.state      !== undefined) address.state      = body.state.trim();
    if (body.postalCode !== undefined) address.postalCode = body.postalCode.trim();
    if (body.country    !== undefined) address.country    = body.country.trim();
    if (body.isDefault  !== undefined) address.isDefault  = body.isDefault;

    await user.save();

    return NextResponse.json({ success: true, data: user.addresses });
  } catch (err) {
    console.error('[PATCH /api/addresses/[id]]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE /api/addresses/[id] ─────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = auth(req);
  if (!payload) {
    return NextResponse.json<ApiResponse>({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await connectDB();
    const user = await User.findById(payload.userId).select('addresses');
    if (!user) {
      return NextResponse.json<ApiResponse>({ error: 'User not found' }, { status: 404 });
    }

    const address = user.addresses.find(a => a._id?.toString() === id);
    if (!address) {
      return NextResponse.json<ApiResponse>({ error: 'Address not found' }, { status: 404 });
    }

    const wasDefault = address.isDefault;
    user.addresses = user.addresses.filter(
      a => a._id?.toString() !== id,
    ) as typeof user.addresses;

    // If the deleted address was the default, promote the first remaining
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return NextResponse.json({ success: true, data: user.addresses });
  } catch (err) {
    console.error('[DELETE /api/addresses/[id]]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error' }, { status: 500 });
  }
}
