import { NextRequest, NextResponse } from 'next/server';
import connectDB                    from '@/lib/mongodb';
import AdminNote                    from '@/models/AdminNote';
import User                         from '@/models/User';
import { requireAdmin }             from '@/lib/admin-auth';
import type { ApiResponse }         from '@/types/auth';
import mongoose                     from 'mongoose';

// ── POST — add admin note ──────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid customer ID.' }, { status: 400 });
  }

  try {
    await connectDB();
    const { content } = (await req.json()) as { content?: string };
    if (!content?.trim()) {
      return NextResponse.json<ApiResponse>({ error: 'Note content is required.' }, { status: 400 });
    }

    const adminDoc = await User.findById(admin.userId).select('firstName lastName').lean() as { _id: mongoose.Types.ObjectId; firstName: string; lastName: string } | null;
    const adminName = adminDoc ? `${adminDoc.firstName} ${adminDoc.lastName}` : 'Admin';
    const note = await AdminNote.create({
      customerId: id,
      adminId:    admin.userId,
      adminName,
      content:    content.trim(),
    });

    return NextResponse.json<ApiResponse<unknown>>({ success: true, data: note }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/customers/[id]/notes POST]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}

// ── DELETE — remove admin note ─────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { noteId } = (await req.json()) as { noteId?: string };

  if (!noteId || !mongoose.isValidObjectId(noteId)) {
    return NextResponse.json<ApiResponse>({ error: 'Invalid note ID.' }, { status: 400 });
  }

  try {
    await connectDB();
    await AdminNote.findOneAndDelete({ _id: noteId, customerId: id });
    return NextResponse.json<ApiResponse>({ success: true });
  } catch (err) {
    console.error('[api/admin/customers/[id]/notes DELETE]', err);
    return NextResponse.json<ApiResponse>({ error: 'Server error.' }, { status: 500 });
  }
}
