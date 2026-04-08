import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/models/AdminActivityLog';
import { sendAdminInviteEmail } from '@/lib/email';
import type { ApiResponse } from '@/types/auth';

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

// ── GET /api/admin/team ────────────────────────────────────────────────────────
// List all admin accounts (admin, superadmin, viewer)

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  try {
    await connectDB();

    // The requester is clearly active right now — stamp their lastLoginAt.
    // Fire-and-forget so it never delays the response.
    const now = new Date();
    User.findByIdAndUpdate(admin.userId, { lastLoginAt: now }).catch(() => {});

    const members = await User.find({
      role: { $in: ['admin', 'superadmin', 'viewer'] },
    })
      .select(
        'firstName lastName email role isVerified isSuspended lastLoginAt inviteTokenExpires createdAt avatar',
      )
      .sort({ createdAt: -1 })
      .lean();

    const data = members.map((m) => ({
      _id: m._id.toString(),
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
      role: m.role,
      avatar: m.avatar ?? null,
      // Override lastLoginAt with `now` for the requesting admin so it's always
      // accurate — they are provably active at this exact moment.
      lastLoginAt:
        m._id.toString() === admin.userId
          ? now.toISOString()
          : (m.lastLoginAt?.toISOString() ?? null),
      createdAt: (m.createdAt as Date).toISOString(),
      status: m.isSuspended ? 'suspended' : m.isVerified ? 'active' : 'invited',
    }));

    return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
  } catch (err) {
    console.error('[api/admin/team GET]', err);
    return NextResponse.json<ApiResponse>(
      { error: 'Server error.' },
      { status: 500 },
    );
  }
}

// ── POST /api/admin/team ───────────────────────────────────────────────────────
// Invite a new admin (superadmin only)

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  console.log(admin, 'admin');

  if (!admin) {
    return NextResponse.json<ApiResponse>(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can invite team members.' },
      { status: 403 },
    );
  }

  try {
    const body = (await req.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
      message?: string;
    };

    const { firstName, lastName, email, role, message } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json<ApiResponse>(
        { error: 'First name, last name, and email are required.' },
        { status: 400 },
      );
    }

    const validRoles = ['admin', 'superadmin', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json<ApiResponse>(
        { error: 'Role must be admin, superadmin, or viewer.' },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExp = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    const newMember = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      role,
      isVerified: false,
      inviteToken,
      inviteTokenExpires: inviteTokenExp,
      // Dummy password — user sets their own on first login via invite link
      password: crypto.randomBytes(16).toString('hex'),
    });

    // Send invite email (non-blocking on failure)
    const setupUrl = `${BASE_URL}/admin/setup?token=${inviteToken}`;
    const inviterName = `${admin.email}`; // Will be replaced with full name once we store it in JWT
    try {
      await sendAdminInviteEmail(
        newMember.email,
        newMember.firstName,
        inviterName,
        setupUrl,
        role,
        message,
      );
    } catch (emailErr) {
      console.error('[api/admin/team] Invite email failed:', emailErr);
      // Don't fail the request — user is created, email is best-effort
    }

    await logAdminAction({
      adminId: admin.userId,
      adminName: admin.email,
      adminRole: admin.role,
      action: 'invited_admin',
      detail: `Invited ${firstName} ${lastName} (${email}) as ${role}`,
      targetType: 'admin',
      targetId: newMember._id.toString(),
    });

    return NextResponse.json<
      ApiResponse<{
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        status: string;
      }>
    >(
      {
        success: true,
        message: `Invitation sent to ${email}. The link expires in 48 hours.`,
        data: {
          _id: newMember._id.toString(),
          firstName: newMember.firstName,
          lastName: newMember.lastName,
          email: newMember.email,
          role: newMember.role,
          status: 'invited',
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[api/admin/team POST]', err);
    return NextResponse.json<ApiResponse>(
      { error: 'Server error.' },
      { status: 500 },
    );
  }
}
