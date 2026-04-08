import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin } from '@/lib/admin-auth';
import { logAdminAction } from '@/models/AdminActivityLog';
import type { ApiResponse } from '@/types/auth';

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/admin/team/[id] ────────────────────────────────────────────────
// Update role or suspended status (superadmin only)

export async function PATCH(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can modify team members.' },
      { status: 403 },
    );
  }

  const { id } = await params;

  if (id === admin.userId) {
    return NextResponse.json<ApiResponse>(
      { error: 'You cannot modify your own account from here.' },
      { status: 400 },
    );
  }

  try {
    const body = await req.json() as { role?: string; isSuspended?: boolean };
    const { role, isSuspended } = body;

    const validRoles = ['admin', 'superadmin', 'viewer'];
    if (role !== undefined && !validRoles.includes(role)) {
      return NextResponse.json<ApiResponse>(
        { error: 'Invalid role.' },
        { status: 400 },
      );
    }

    await connectDB();

    const member = await User.findOne({
      _id:  id,
      role: { $in: ['admin', 'superadmin', 'viewer'] },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({ error: 'Team member not found.' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    let actionDetail = '';

    if (role !== undefined && role !== member.role) {
      updates.role = role;
      actionDetail = `Changed ${member.firstName} ${member.lastName}'s role from ${member.role} to ${role}`;
    }

    if (isSuspended !== undefined && isSuspended !== member.isSuspended) {
      updates.isSuspended = isSuspended;
      actionDetail = isSuspended
        ? `Suspended ${member.firstName} ${member.lastName}`
        : `Restored ${member.firstName} ${member.lastName}'s account`;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json<ApiResponse>(
        { error: 'No changes to apply.' },
        { status: 400 },
      );
    }

    await User.findByIdAndUpdate(id, updates);

    await logAdminAction({
      adminId:    admin.userId,
      adminName:  admin.email,
      adminRole:  admin.role,
      action:     role !== undefined ? 'updated_role' : isSuspended ? 'suspended_admin' : 'restored_admin',
      detail:     actionDetail,
      targetType: 'admin',
      targetId:   id,
    });

    return NextResponse.json<ApiResponse>({ success: true, message: 'Team member updated.' });
  } catch (err) {
    console.error('[api/admin/team/[id] PATCH]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE /api/admin/team/[id] ───────────────────────────────────────────────
// Remove an admin (superadmin only, cannot remove self)

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }
  if (admin.role !== 'superadmin') {
    return NextResponse.json<ApiResponse>(
      { error: 'Only Super Admins can remove team members.' },
      { status: 403 },
    );
  }

  const { id } = await params;

  if (id === admin.userId) {
    return NextResponse.json<ApiResponse>(
      { error: 'You cannot remove your own account.' },
      { status: 400 },
    );
  }

  try {
    await connectDB();

    const member = await User.findOne({
      _id:  id,
      role: { $in: ['admin', 'superadmin', 'viewer'] },
    });

    if (!member) {
      return NextResponse.json<ApiResponse>({ error: 'Team member not found.' }, { status: 404 });
    }

    await User.findByIdAndDelete(id);

    await logAdminAction({
      adminId:    admin.userId,
      adminName:  admin.email,
      adminRole:  admin.role,
      action:     'removed_admin',
      detail:     `Removed ${member.firstName} ${member.lastName} (${member.email}) from the team`,
      targetType: 'admin',
      targetId:   id,
    });

    return NextResponse.json<ApiResponse>({ success: true, message: 'Team member removed.' });
  } catch (err) {
    console.error('[api/admin/team/[id] DELETE]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
